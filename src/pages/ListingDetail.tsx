import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'
import { AD_TYPE_LABELS, CONDITION_LABELS } from '../types'

function formatPrice(price: number | null) {
  if (price == null) return 'Menor da Liga'
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function whatsappLink(phone: string, cardName: string) {
  const digits = phone.replace(/\D/g, '')
  const text = encodeURIComponent(`Olá! Vi seu anúncio de "${cardName}" na Vitrine One Piece TCG e tenho interesse.`)
  return `https://wa.me/${digits}?text=${text}`
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else if (!data) setError('Anúncio não encontrado.')
        else setListing(data as Listing)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <p className="p-6 text-center text-sm text-slate-500">Carregando...</p>
  if (error || !listing)
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-red-400">{error ?? 'Anúncio não encontrado.'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-red-500 underline">
          Voltar para a vitrine
        </button>
      </div>
    )

  const seller = listing.profiles

  return (
    <div className="mx-auto max-w-md pb-28">
      <div className="relative aspect-[5/7] w-full bg-slate-800">
        {listing.images.length > 0 ? (
          <img src={listing.images[activeImage]} alt={listing.card_name} className="h-full w-full object-cover" />
        ) : listing.reference_image ? (
          <>
            <img src={listing.reference_image} alt={listing.card_name} className="h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-slate-200">
              Imagem oficial da carta
            </span>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">Sem foto</div>
        )}
        <Link
          to="/"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
        >
          ←
        </Link>
      </div>

      {listing.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {listing.images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActiveImage(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                i === activeImage ? 'border-red-500' : 'border-transparent'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            listing.ad_type === 'venda' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {AD_TYPE_LABELS[listing.ad_type]}
        </span>
        <h1 className="mt-2 text-xl font-bold text-slate-100">{listing.card_name}</h1>
        {listing.card_code && <p className="font-mono text-sm text-slate-400">{listing.card_code}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold text-green-500">{formatPrice(listing.price)}</span>
          {listing.condition && (
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {CONDITION_LABELS[listing.condition]}
            </span>
          )}
          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
            Qtd. disponível: {listing.quantity}
          </span>
        </div>

        {listing.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{listing.description}</p>
        )}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Vendedor</p>
          <p className="mt-1 font-semibold text-slate-100">{seller?.display_name ?? 'Usuário'}</p>

          <div className="mt-3 flex flex-col gap-2">
            {seller?.whatsapp && (
              <a
                href={whatsappLink(seller.whatsapp, listing.card_name)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white"
              >
                Chamar no WhatsApp
              </a>
            )}
            {seller?.discord && (
              <div className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-200">
                <span>Discord: {seller.discord}</span>
              </div>
            )}
            {!seller?.whatsapp && !seller?.discord && (
              <p className="text-sm text-slate-500">Vendedor não informou contato.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
