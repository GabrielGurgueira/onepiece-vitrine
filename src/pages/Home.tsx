import { useEffect, useMemo, useState } from 'react'
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
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSet, setSelectedSet] = useState('todos')
  const [selectedColor, setSelectedColor] = useState('todos')
  const [selectedRarity, setSelectedRarity] = useState('todos')

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

  const availableSets = useMemo(
    () => Array.from(new Set(listings.map((l) => l.set_name).filter((v): v is string => Boolean(v)))).sort(),
    [listings],
  )
  const availableColors = useMemo(
    () => Array.from(new Set(listings.map((l) => l.color).filter((v): v is string => Boolean(v)))).sort(),
    [listings],
  )
  const availableRarities = useMemo(
    () => Array.from(new Set(listings.map((l) => l.rarity).filter((v): v is string => Boolean(v)))).sort(),
    [listings],
  )
  const activeFilterCount = [selectedSet, selectedColor, selectedRarity].filter((v) => v !== 'todos').length

  const filtered = listings.filter((l) => {
    if (filter !== 'todos' && l.ad_type !== filter) return false
    if (selectedSet !== 'todos' && l.set_name !== selectedSet) return false
    if (selectedColor !== 'todos' && l.color !== selectedColor) return false
    if (selectedRarity !== 'todos' && l.rarity !== selectedRarity) return false
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

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1 self-start text-xs font-semibold text-slate-300"
        >
          <span>{showFilters ? '▾' : '▸'}</span>
          Filtros
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span>
          )}
        </button>

        {showFilters && (
          <div className="grid grid-cols-3 gap-2">
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
            >
              <option value="todos">Set</option>
              {availableSets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
            >
              <option value="todos">Cor</option>
              {availableColors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
            >
              <option value="todos">Raridade</option>
              {availableRarities.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {showFilters && activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedSet('todos')
              setSelectedColor('todos')
              setSelectedRarity('todos')
            }}
            className="self-start text-xs text-red-400 underline"
          >
            Limpar filtros
          </button>
        )}
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
