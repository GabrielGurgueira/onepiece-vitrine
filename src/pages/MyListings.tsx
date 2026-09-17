import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Listing, ListingStatus } from '../types'
import { AD_TYPE_LABELS } from '../types'

export default function MyListings() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(userId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setListings((data ?? []) as Listing[])
    setLoading(false)
  }

  useEffect(() => {
    if (user) load(user.id)
  }, [user])

  async function updateStatus(id: string, status: ListingStatus) {
    await supabase.from('listings').update({ status }).eq('id', id)
    if (user) load(user.id)
  }

  async function deleteListing(id: string) {
    if (!confirm('Excluir este anúncio? Essa ação não pode ser desfeita.')) return
    await supabase.from('listings').delete().eq('id', id)
    if (user) load(user.id)
  }

  if (authLoading) return <p className="p-6 text-center text-sm text-slate-500">Carregando...</p>

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-10 text-center">
        <p className="text-sm text-slate-300">Você precisa entrar para ver seus anúncios.</p>
        <button
          onClick={() => navigate('/entrar')}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold text-slate-100">Meus anúncios</h1>

      {loading && <p className="mt-6 text-center text-sm text-slate-500">Carregando...</p>}
      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
      {!loading && listings.length === 0 && !error && (
        <p className="mt-6 text-center text-sm text-slate-500">Você ainda não criou nenhum anúncio.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {listings.map((listing) => (
          <div key={listing.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  {AD_TYPE_LABELS[listing.ad_type]} · {listing.status}
                </span>
                <h3 className="text-sm font-semibold text-slate-100">{listing.card_name}</h3>
              </div>
              {listing.images[0] && (
                <img src={listing.images[0]} alt="" className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {listing.status !== 'ativo' && (
                <button
                  onClick={() => updateStatus(listing.id, 'ativo')}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  Reativar
                </button>
              )}
              {listing.status === 'ativo' && listing.ad_type === 'venda' && (
                <button
                  onClick={() => updateStatus(listing.id, 'vendido')}
                  className="rounded-full bg-green-700 px-3 py-1 text-xs font-medium text-white"
                >
                  Marcar como vendido
                </button>
              )}
              {listing.status === 'ativo' && (
                <button
                  onClick={() => updateStatus(listing.id, 'encerrado')}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  Encerrar
                </button>
              )}
              <button
                onClick={() => deleteListing(listing.id)}
                className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-300"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
