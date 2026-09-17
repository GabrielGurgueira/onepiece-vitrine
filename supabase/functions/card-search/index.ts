import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const APITCG_BASE = "https://api.apitcg.com/api/products";
const RESULT_LIMIT = 6;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isCodeLike(q: string) {
  return /^[a-z]{2,4}\d{1,3}(-\d{0,4})?$/i.test(q.trim());
}

function getServiceKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysJson) {
    try {
      const parsed = JSON.parse(secretKeysJson);
      const values = Object.values(parsed).filter((v) => typeof v === "string");
      if (values.length > 0) return values[0] as string;
    } catch {
      // ignore
    }
  }
  return null;
}

function rowToResult(row: any) {
  return {
    id: row.api_id,
    name: row.name,
    code: row.code,
    image: row.image,
    set_name: row.set_name,
    rarity: row.rarity,
  };
}

function itemToResult(item: any) {
  return {
    id: item._id,
    name: item.name,
    code: item.code,
    image: item.images?.[0]?.medium || item.images?.[0]?.small || item.images?.[0]?.large || null,
    set_name: item.set?.name ?? null,
    rarity: item.attributes?.Rarity ?? null,
  };
}

async function fetchFromApiTcg(url: string, apiKey: string) {
  try {
    const res = await fetch(url, { headers: { "x-api-key": apiKey } });
    if (!res.ok) return [];
    const body = await res.json();
    return body.data ?? [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 3) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = getServiceKey();
    const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    // 1. Verifica primeiro se já temos cartas relevantes cacheadas no nosso banco.
    const qLower = q.toLowerCase();
    const cachedRows: any[] = [];
    if (supabase) {
      const [byName, byCode] = await Promise.all([
        supabase.from("card_cache").select("*").ilike("name", `%${q}%`).limit(RESULT_LIMIT),
        supabase.from("card_cache").select("*").ilike("code", `%${q}%`).limit(RESULT_LIMIT),
      ]);
      const seenLocal = new Set();
      for (const row of [...(byName.data ?? []), ...(byCode.data ?? [])]) {
        if (seenLocal.has(row.api_id)) continue;
        seenLocal.add(row.api_id);
        cachedRows.push(row);
      }
    }

    // 2. Cache local já cobre a busca: não gasta chamada na APITCG.
    if (cachedRows.length >= RESULT_LIMIT) {
      return new Response(JSON.stringify({ results: cachedRows.slice(0, RESULT_LIMIT).map(rowToResult) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("APITCG_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ results: cachedRows.map(rowToResult) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Complementa com a API só pelo que falta.
    const codeLike = isCodeLike(q);
    const targetUrl = codeLike
      ? `${APITCG_BASE}?tcg=one-piece&type=card&code=${encodeURIComponent(q.toUpperCase())}&limit=${RESULT_LIMIT}`
      : `${APITCG_BASE}?tcg=one-piece&type=card&name=${encodeURIComponent(q)}&limit=${RESULT_LIMIT}`;

    const rawList = await fetchFromApiTcg(targetUrl, apiKey);

    const relevant = rawList.filter((item: any) => {
      const nameMatch = item.name?.toLowerCase().includes(qLower);
      const codeMatch = item.code?.toLowerCase().includes(qLower);
      return nameMatch || codeMatch;
    });
    const freshList = relevant.length > 0 ? relevant : rawList;

    // 4. Guarda tudo que veio da API no nosso banco, com a data do armazenamento.
    if (supabase && freshList.length > 0) {
      const rows = freshList.map((item: any) => ({
        api_id: item._id,
        name: item.name,
        code: item.code ?? null,
        image: item.images?.[0]?.medium || item.images?.[0]?.small || item.images?.[0]?.large || null,
        set_name: item.set?.name ?? null,
        rarity: item.attributes?.Rarity ?? null,
        cached_at: new Date().toISOString(),
      }));
      await supabase.from("card_cache").upsert(rows, { onConflict: "api_id" });
    }

    // 5. Combina cache local + complemento vindo da API, sem duplicar.
    const merged = [];
    const seen = new Set();
    for (const row of cachedRows) {
      if (seen.has(row.api_id)) continue;
      seen.add(row.api_id);
      merged.push(rowToResult(row));
    }
    for (const item of freshList) {
      if (seen.has(item._id)) continue;
      seen.add(item._id);
      merged.push(itemToResult(item));
      if (merged.length >= RESULT_LIMIT) break;
    }

    return new Response(JSON.stringify({ results: merged.slice(0, RESULT_LIMIT) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
