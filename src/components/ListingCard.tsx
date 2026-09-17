import { Link } from 'react-router-dom'
import type { Listing } from '../types'
import { AD_TYPE_LABELS, CONDITION_LABELS } from '../types'

function formatPrice(price: number | null) {
  if (price == null) return 'Menor da Liga'
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0] ?? listing.reference_image

  return (
    <Link
      to={`/anuncio/${listing.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[5/7] w-full bg-slate-800">
        {cover ? (
          <img src={cover} alt={listing.card_name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">Sem foto</div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-[9.2px] py-[2.3px] text-[12.65px] font-semibold ${
            listing.ad_type === 'venda' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {AD_TYPE_LABELS[listing.ad_type]}
        </span>
        {listing.status !== 'ativo' && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold uppercase tracking-wide text-white">
            {listing.status === 'vendido' ? 'Vendido' : 'Encerrado'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-100">{listing.card_name}</h3>
        {listing.card_code && <p className="font-mono text-xs text-slate-400">{listing.card_code}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-green-500">{formatPrice(listing.price)}</span>
          {listing.condition && (
            <span className="text-[11px] text-slate-400">{CONDITION_LABELS[listing.condition]}</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">Qtd. disponível: {listing.quantity}</p>
      </div>
    </Link>
  )
}
