export interface CardSuggestion {
  id: number | string
  name: string
  code: string
  image: string | null
  set_name: string | null
  rarity: string | null
  color: string | null
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/card-search`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function searchCards(query: string): Promise<CardSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = `${FUNCTIONS_URL}?q=${encodeURIComponent(trimmed)}`
  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  })

  if (!res.ok) throw new Error('Falha ao buscar cartas')
  const body = await res.json()
  return body.results ?? []
}
