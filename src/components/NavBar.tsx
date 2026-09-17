import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkBase =
  'flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs font-medium transition-colors'

function linkClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${isActive ? 'text-red-600' : 'text-slate-400'}`
}

export default function NavBar() {
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        <NavLink to="/" end className={linkClass}>
          <span>🏴‍☠️</span>
          <span>Vitrine</span>
        </NavLink>
        <NavLink to="/novo" className={linkClass}>
          <span>➕</span>
          <span>Anunciar</span>
        </NavLink>
        <NavLink to={user ? '/meus-anuncios' : '/entrar'} className={linkClass}>
          <span>📋</span>
          <span>Meus anúncios</span>
        </NavLink>
        <NavLink to="/entrar" className={linkClass}>
          <span>👤</span>
          <span>{user ? 'Conta' : 'Entrar'}</span>
        </NavLink>
      </div>
    </nav>
  )
}
