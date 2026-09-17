import { type FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [discord, setDiscord] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setWhatsapp(profile.whatsapp ?? '')
      setDiscord(profile.discord ?? '')
    }
  }, [profile])

  async function handleSendLink(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim() || 'Usuário',
      whatsapp: whatsapp.trim() || null,
      discord: discord.trim() || null,
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      await refreshProfile()
    }
  }

  if (loading) return <p className="p-6 text-center text-sm text-slate-500">Carregando...</p>

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-8">
        <h1 className="text-xl font-bold text-slate-100">Entrar</h1>
        <p className="mt-1 text-sm text-slate-400">
          Entre com seu e-mail para anunciar cartas. Você vai receber um link mágico, sem senha.
        </p>

        {sent ? (
          <p className="mt-6 rounded-lg border border-green-800 bg-green-950/40 p-4 text-sm text-green-300">
            Link enviado para <strong>{email}</strong>. Abra seu e-mail e clique no link para entrar.
          </p>
        ) : (
          <form onSubmit={handleSendLink} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sending ? 'Enviando...' : 'Enviar link de acesso'}
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <h1 className="text-xl font-bold text-slate-100">Meu perfil</h1>
      <p className="mt-1 text-sm text-slate-400">{user.email}</p>

      <form onSubmit={handleSaveProfile} className="mt-6 flex flex-col gap-3">
        <label className="text-sm text-slate-300">
          Nome de exibição
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:border-red-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-300">
          WhatsApp (com DDI e DDD, ex: 5511999999999)
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="5511999999999"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-300">
          Discord (usuário)
          <input
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="usuario#0000"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
          />
        </label>

        {saved && <p className="text-sm text-green-400">Perfil salvo!</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>

      <button onClick={() => signOut()} className="mt-6 text-sm text-slate-400 underline">
        Sair da conta
      </button>
    </div>
  )
}
