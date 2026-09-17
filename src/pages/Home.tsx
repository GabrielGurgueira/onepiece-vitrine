import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { AdType, Listing } from '../types'
import { AD_TYPE_LABELS } from '../types'
import ListingCard from '../components/ListingCard'

type FilterType = 'todos' | AdType

interface MatchState {
  matchFound: boolean
  matchCount: number
  oppositeType: AdType
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [filter, setFilter] = useState<FilterType>(() => {
    const tipo = searchParams.get('tipo')
    return tipo === 'venda' || tipo === 'compra' ? tipo : 'todos'
  })
  const [error, setError] = useState<string | null>(null)

  const matchState = location.state as MatchState | null
  const [showMatchBanner, setShowMatchBanner] = useState(Boolean(matchState?.matchFound))

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else setListings((data ?? []) as Listing[])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = listings.filter((l) => {
    if (filter !== 'todos' && l.ad_type !== filter) return false
    const term = search.trim().toLowerCase()
    if (term) {
      const matchesName = l.card_name.toLowerCase().includes(term)
      const matchesCode = l.card_code?.toLowerCase().includes(term) ?? false
      if (!matchesName && !matchesCode) return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-slate-100">Vitrine One Piece TCG</h1>
      <p className="mt-1 text-sm text-slate-400">Anúncios da comunidade para comprar e vender cartas</p>

      {showMatchBanner && matchState && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-700 bg-green-950/40 p-3 text-sm text-green-300">
          <span className="flex-1">
            🎉 Encontramos {matchState.matchCount}{' '}
            {matchState.matchCount === 1 ? 'anúncio' : 'anúncios'} de{' '}
            {AD_TYPE_LABELS[matchState.oppositeType].toLowerCase()} que podem combinar com o seu!
          </span>
          <button onClick={() => setShowMatchBanner(false)} className="text-green-400" aria-label="Fechar aviso">
            ✕
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou código da carta..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
        />
        <div className="flex gap-2">
          {(['todos', 'venda', 'compra'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'venda' ? 'À venda' : 'Procurados'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">Erro ao carregar anúncios: {error}</p>}

      {loading && <p className="mt-8 text-center text-sm text-slate-500">Carregando anúncios...</p>}

      {!loading && filtered.length === 0 && !error && (
        <p className="mt-8 text-center text-sm text-slate-500">Nenhum anúncio encontrado.</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
