import { useRef, useState } from 'react'
import { searchCards, type CardSuggestion } from '../lib/cardSearch'

interface Props {
  query: string
  onQueryChange: (value: string) => void
  onSelect: (card: CardSuggestion) => void
  selectedCard: CardSuggestion | null
  onClearSelection: () => void
}

export default function CardAutocomplete({ query, onQueryChange, onSelect, selectedCard, onClearSelection }: Props) {
  const [suggestions, setSuggestions] = useState<CardSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)

  function handleChange(value: string) {
    onQueryChange(value)
    if (selectedCard) onClearSelection()

    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    const trimmed = value.trim()
    if (trimmed.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      setSearching(false)
      return
    }

    setSearching(true)
    setSearchError(false)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await searchCards(trimmed)
        setSuggestions(results)
        setShowDropdown(true)
      } catch {
        setSuggestions([])
        setSearchError(true)
      } finally {
        setSearching(false)
      }
    }, 150)
  }

  function handleSelect(card: CardSuggestion) {
    onSelect(card)
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div className="relative">
      <label className="text-sm text-slate-300">
        Código da carta ou nome da carta *
        <input
          required
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => window.setTimeout(() => setShowDropdown(false), 150)}
          placeholder='Ex: "ST31-004" ou "Monkey D. Luffy"'
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
        />
      </label>

      {searching && <p className="mt-1 text-xs text-slate-500">Buscando cartas...</p>}
      {searchError && <p className="mt-1 text-xs text-red-400">Não foi possível buscar cartas agora. Você pode preencher o nome manualmente.</p>}
      {!searching && showDropdown && suggestions.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">Nenhuma carta encontrada. Você pode preencher o nome manualmente.</p>
      )}

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
          {suggestions.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(card)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-800"
              >
                {card.image ? (
                  <img src={card.image} alt="" className="h-12 w-9 flex-shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-12 w-9 flex-shrink-0 rounded bg-slate-800" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-100">{card.name}</span>
                  <span className="block text-xs text-slate-400">
                    {card.code}
                    {card.set_name ? ` · ${card.set_name}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedCard && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
          {selectedCard.image ? (
            <img src={selectedCard.image} alt={selectedCard.name} className="h-24 w-[68px] flex-shrink-0 rounded object-cover" />
          ) : (
            <div className="h-24 w-[68px] flex-shrink-0 rounded bg-slate-800" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{selectedCard.name}</p>
            <p className="text-xs text-slate-400">{selectedCard.code}</p>
            {selectedCard.set_name && <p className="text-xs text-slate-400">{selectedCard.set_name}</p>}
            {selectedCard.rarity && <p className="text-xs text-slate-400">Raridade: {selectedCard.rarity}</p>}
            <button
              type="button"
              onClick={onClearSelection}
              className="mt-1 text-xs text-red-400 underline"
            >
              Trocar carta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
