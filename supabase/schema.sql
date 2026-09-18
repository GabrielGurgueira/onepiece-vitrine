-- Vitrine One Piece TCG — schema Supabase
-- Rode este script inteiro no SQL Editor do seu projeto Supabase (Supabase Dashboard > SQL Editor > New query).

-- 1. Perfis (dados públicos de contato do usuário, vinculados ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Usuário',
  whatsapp text,
  discord text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Perfis são públicos para leitura"
  on public.profiles for select
  using (true);

create policy "Usuário pode criar seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuário pode atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Anúncios
-- condition: NM (Near Mint), SP (Slightly Played), MP (Moderately Played), D (Danificada)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  ad_type text not null check (ad_type in ('venda', 'compra')),
  card_name text not null,
  card_code text,
  reference_image text,
  set_name text,
  set_release_date date,
  rarity text,
  color text,
  condition text check (condition in ('NM', 'SP', 'MP', 'D')),
  price numeric(10, 2),
  quantity integer not null default 1 check (quantity >= 0),
  description text,
  images text[] not null default '{}',
  status text not null default 'ativo' check (status in ('ativo', 'vendido', 'encerrado')),
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Anúncios ativos são públicos para leitura"
  on public.listings for select
  using (status = 'ativo' or seller_id = auth.uid());

create policy "Usuário pode criar seus próprios anúncios"
  on public.listings for insert
  with check (seller_id = auth.uid());

create policy "Usuário pode atualizar seus próprios anúncios"
  on public.listings for update
  using (seller_id = auth.uid());

create policy "Usuário pode excluir seus próprios anúncios"
  on public.listings for delete
  using (seller_id = auth.uid());

create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id);

-- 3. Storage: bucket público para as fotos dos anúncios
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Qualquer um pode ver as imagens dos anúncios"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "Usuário autenticado pode enviar imagens na própria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Usuário pode excluir suas próprias imagens"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Cache de cartas da APITCG
-- Usado pela Edge Function card-search para evitar chamadas repetidas à API
-- externa: toda carta retornada pela APITCG é salva aqui com a data da
-- consulta, e buscas futuras priorizam esses dados antes de chamar a API.
-- RLS fica ligado sem nenhuma policy: só a service role (usada pela Edge
-- Function) acessa esta tabela, nunca o app do navegador.
create table if not exists public.card_cache (
  api_id bigint primary key,
  name text not null,
  code text,
  image text,
  set_name text,
  set_release_date date,
  rarity text,
  color text,
  cached_at timestamptz not null default now()
);

alter table public.card_cache enable row level security;

create index if not exists card_cache_code_idx on public.card_cache (lower(code));
create index if not exists card_cache_name_idx on public.card_cache (lower(name));
