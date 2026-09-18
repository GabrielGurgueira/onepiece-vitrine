import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CardAutocomplete from '../components/CardAutocomplete'
import type { CardSuggestion } from '../lib/cardSearch'
import type { AdType, CardCondition } from '../types'

const MAX_IMAGES = 5

export default function NewListing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [adType, setAdType] = useState<AdType>('venda')
  const [cardName, setCardName] = useState('')
  const [selectedCard, setSelectedCard] = useState<CardSuggestion | null>(null)
  const [setName, setSetName] = useState('')
  const [condition, setCondition] = useState<CardCondition>('NM')
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-10 text-center">
        <p className="text-sm text-slate-300">Você precisa entrar para criar um anúncio.</p>
        <button onClick={() => navigate('/entrar')} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
          Entrar
        </button>
      </div>
    )
  }

  if (!profile?.whatsapp && !profile?.discord) {
    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-10 text-center">
        <p className="text-sm text-slate-300">
          Complete seu perfil com WhatsApp ou Discord antes de anunciar, para que os compradores consigam falar com você.
        </p>
        <button onClick={() => navigate('/entrar')} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
          Completar perfil
        </button>
      </div>
    )
  }

  function handleFiles(list: FileList | null) {
    if (!list) return
    const picked = Array.from(list).slice(0, MAX_IMAGES)
    setFiles(picked)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSubmitting(true)

    try {
      const imageUrls: string[] = []
      for (const file of files) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
        imageUrls.push(data.publicUrl)
      }

      const { error: insertError } = await supabase.from('listings').insert({
        seller_id: user.id,
        ad_type: adType,
        card_name: cardName.trim(),
        card_code: selectedCard?.code ?? null,
        reference_image: selectedCard?.image ?? null,
        set_name: setName.trim() || null,
        set_release_date: selectedCard?.set_release_date ?? null,
        rarity: selectedCard?.rarity ?? null,
        color: selectedCard?.color ?? null,
        condition: adType === 'venda' ? condition : null,
        price: price ? Number(price) : null,
        quantity: quantity ? Number(quantity) : 1,
        description: description.trim() || null,
        images: imageUrls,
        status: 'ativo',
      })
      if (insertError) throw insertError

      // Procura anúncios complementares já na vitrine (venda <-> procuro da mesma carta).
      const oppositeType: AdType = adType === 'venda' ? 'compra' : 'venda'
      let matchQuery = supabase
        .from('listings')
        .select('id')
        .eq('status', 'ativo')
        .eq('ad_type', oppositeType)
        .neq('seller_id', user.id)

      matchQuery = selectedCard?.code
        ? matchQuery.eq('card_code', selectedCard.code)
        : matchQuery.ilike('card_name', `%${cardName.trim()}%`)

      const { data: matches } = await matchQuery.limit(20)

      if (matches && matches.length > 0) {
        const term = selectedCard?.code ?? cardName.trim()
        navigate(`/?q=${encodeURIComponent(term)}&tipo=${oppositeType}`, {
          state: { matchFound: true, matchCount: matches.length, oppositeType },
        })
      } else {
        navigate('/meus-anuncios')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar anúncio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold text-slate-100">Novo anúncio</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <CardAutocomplete
          query={cardName}
          onQueryChange={setCardName}
          selectedCard={selectedCard}
          onSelect={(card) => {
            setSelectedCard(card)
            setCardName(card.name)
            if (card.set_name) setSetName(card.set_name)
          }}
          onClearSelection={() => setSelectedCard(null)}
        />

        <div className="flex gap-2">
          {(['venda', 'compra'] as AdType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAdType(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                adType === t ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {t === 'venda' ? 'Estou vendendo' : 'Estou procurando'}
            </button>
          ))}
        </div>

        <label className="text-sm text-slate-300">
          Código da carta
          <input
            readOnly
            value={selectedCard?.code ?? ''}
            placeholder="Selecione uma carta acima"
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 placeholder:text-slate-500 focus:outline-none"
          />
        </label>

        {adType === 'venda' && (
          <label className="text-sm text-slate-300">
            Condição
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as CardCondition)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:border-red-500 focus:outline-none"
            >
              <option value="NM">Near Mint (NM)</option>
              <option value="SP">Slightly Played (SP)</option>
              <option value="MP">Moderately Played (MP)</option>
              <option value="D">Danificada (D)</option>
            </select>
          </label>
        )}

        <label className="text-sm text-slate-300">
          Quantidade
          <input
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:border-red-500 focus:outline-none"
          />
        </label>

        <label className="text-sm text-slate-300">
          Preço (R$) — deixe em branco para "Menor da Liga"
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 150.00"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
          />
        </label>

        <label className="text-sm text-slate-300">
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Detalhes sobre a carta, estado de conservação, forma de entrega..."
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
          />
        </label>

        <label className="text-sm text-slate-300">
          Fotos (até {MAX_IMAGES})
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="mt-1 w-full text-sm text-slate-300"
          />
        </label>

        {files.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {files.map((f) => (
              <img
                key={f.name}
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
              />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Publicando...' : 'Publicar anúncio'}
        </button>
      </form>
    </div>
  )
}
