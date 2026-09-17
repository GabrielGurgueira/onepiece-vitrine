# Vitrine One Piece TCG

App web (PWA, instalável no celular) para a comunidade anunciar compra e venda de cartas de One Piece TCG. O contato entre comprador e vendedor acontece fora do app (WhatsApp/Discord) — não há pagamento nem chat interno nesta versão.

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (mobile-first)
- [Supabase](https://supabase.com/) — banco de dados, autenticação (magic link) e storage de imagens
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — instalável na tela inicial do celular

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

### 4. (Opcional) Configure o login por e-mail

Por padrão o Supabase Auth já envia magic links por e-mail. Para produção, configure um provedor de e-mail (SMTP) em **Authentication → Settings** para não depender do limite gratuito do Supabase, e adicione a URL final do app em **Authentication → URL Configuration → Redirect URLs**.

## Como funciona

- Qualquer pessoa pode navegar pelos anúncios (`/`) e ver os detalhes (`/anuncio/:id`), sem login.
- Para anunciar, o usuário entra com e-mail (magic link, sem senha) e completa o perfil com WhatsApp e/ou Discord — é esse contato que aparece no anúncio.
- `/novo` cria um anúncio de venda ou de "procuro" (compra), com fotos enviadas para o Supabase Storage.
- `/meus-anuncios` lista os anúncios do próprio usuário, com opções de marcar como vendido, encerrar, reativar ou excluir.

## Publicar em produção

Qualquer host de site estático funciona (ex: [Vercel](https://vercel.com), [Netlify](https://netlify.com), [Cloudflare Pages](https://pages.cloudflare.com)):

```bash
npm run build
```

Isso gera a pasta `dist/`. Configure as mesmas variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no painel do host escolhido, e lembre de adicionar a URL final do app nas Redirect URLs do Supabase Auth.
