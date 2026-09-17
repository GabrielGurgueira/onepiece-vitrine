# Vitrine One Piece TCG

🔗 **App no ar:** https://onepiece-vitrine.vercel.app

App web (PWA, instalável no celular) para a comunidade anunciar compra e venda de cartas de One Piece TCG. O contato entre comprador e vendedor acontece fora do app (WhatsApp/Discord) — não há pagamento nem chat interno nesta versão.

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (mobile-first)
- [Supabase](https://supabase.com/) — banco de dados, autenticação (magic link), storage de imagens e Edge Functions
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — instalável na tela inicial do celular
- [API TCG](https://docs.apitcg.com) — base de dados de cartas usada no autocomplete ao criar um anúncio
- Hospedado na [Vercel](https://vercel.com), com deploy automático a cada push na branch `main`

## Como rodar localmente

### 1. Crie um projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta/projeto gratuito.
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e execute (`Run`). Isso cria as tabelas `profiles` e `listings`, as políticas de segurança (RLS) e o bucket de imagens `listing-images`.
3. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public` key

### 2. Configure as variáveis de ambiente

Copie `.env.example` para `.env` e preencha com os valores do passo anterior:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

### 3. Instale as dependências e rode

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador (ou no celular, na mesma rede, usando `npm run dev -- --host`).

### 4. Configure a busca de cartas (autocomplete)

O formulário de anúncio busca cartas por nome/código usando a [API TCG](https://apitcg.com), através de uma Supabase Edge Function que também cacheia os resultados no banco (tabela `card_cache`) para economizar chamadas.

1. Crie uma conta gratuita em [apitcg.com/register](https://apitcg.com/register) e pegue sua chave em **Developer Platform → API Key**.
2. Faça deploy da função em [`supabase/functions/card-search`](supabase/functions/card-search) (pelo [Supabase Dashboard → Edge Functions](https://supabase.com/dashboard/project/_/functions) → **Via Editor**, ou via CLI: `supabase functions deploy card-search`).
3. Em **Edge Functions → Secrets**, adicione `APITCG_API_KEY` com a chave do passo 1.

### 5. (Opcional) Configure o login por e-mail

Por padrão o Supabase Auth já envia magic links por e-mail. Para produção, configure um provedor de e-mail (SMTP) em **Authentication → Settings** para não depender do limite gratuito do Supabase, e adicione a URL final do app em **Authentication → URL Configuration → Redirect URLs**.

## Como funciona

- Qualquer pessoa pode navegar pelos anúncios (`/`) e ver os detalhes (`/anuncio/:id`), sem login. A busca aceita nome ou código da carta.
- Para anunciar, o usuário entra com e-mail (magic link, sem senha) e completa o perfil com WhatsApp e/ou Discord — é esse contato que aparece no anúncio.
- `/novo` cria um anúncio de venda ou de "procuro" (compra). O nome/código da carta usa autocomplete (com imagem oficial) e as fotos do próprio vendedor vão para o Supabase Storage.
- Ao publicar, o app procura anúncios complementares já existentes (venda ↔ procuro da mesma carta) e, se achar, avisa o usuário e leva para a vitrine já filtrada.
- `/meus-anuncios` lista os anúncios do próprio usuário, com opções de marcar como vendido, encerrar, reativar ou excluir.

## Publicar em produção

O app está hospedado na [Vercel](https://vercel.com), conectada a este repositório no GitHub — todo push na branch `main` gera um novo deploy automaticamente. Para publicar do zero (nesta Vercel ou em outra, ex: [Netlify](https://netlify.com), [Cloudflare Pages](https://pages.cloudflare.com)):

1. Importe este repositório no painel do host escolhido.
2. Configure as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Adicione a URL final do app nas **Redirect URLs** do Supabase Auth (Authentication → URL Configuration), incluindo um padrão com `/**` para as URLs de preview (ex: `https://seu-projeto-*.vercel.app/**`).

Build local, se precisar:

```bash
npm run build
```
