import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
      isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-400 mx-auto px-6 flex items-center justify-between h-14">

        {/* Logo */}
        <Link
          to="/"
          className="text-white font-black text-sm uppercase tracking-[0.25em] shrink-0 hover:text-emerald-400 transition-colors"
        >
          CrowdLens
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <NavLink to="/movies" className={linkClass}>Movies</NavLink>
          <NavLink to="/tv" className={linkClass}>TV</NavLink>
          <NavLink to="/anime" className={linkClass}>Anime</NavLink>
          <NavLink to="/trending" className={linkClass}>Trending</NavLink>
          <NavLink to="/search" className={linkClass}>Search</NavLink>
          {user && <NavLink to="/feed" className={linkClass}>Feed</NavLink>}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <>
              <Link
                to="/watchlist"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                Watchlist
              </Link>
              <Link
                to="/profile"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                {user.username}
              </Link>
              <Link
                to="/settings"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/60 px-6 py-6 flex flex-col gap-5">
          <NavLink to="/" end onClick={() => setMenuOpen(false)} className={linkClass}>Home</NavLink>
          <NavLink to="/movies" onClick={() => setMenuOpen(false)} className={linkClass}>Movies</NavLink>
          <NavLink to="/tv" onClick={() => setMenuOpen(false)} className={linkClass}>TV</NavLink>
          <NavLink to="/anime" onClick={() => setMenuOpen(false)} className={linkClass}>Anime</NavLink>
          <NavLink to="/trending" onClick={() => setMenuOpen(false)} className={linkClass}>Trending</NavLink>
          <NavLink to="/search" onClick={() => setMenuOpen(false)} className={linkClass}>Search</NavLink>
          {user ? (
            <>
              <NavLink to="/feed" onClick={() => setMenuOpen(false)} className={linkClass}>Feed</NavLink>
              <NavLink to="/watchlist" onClick={() => setMenuOpen(false)} className={linkClass}>Watchlist</NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={linkClass}>{user.username}</NavLink>
              <NavLink to="/settings" onClick={() => setMenuOpen(false)} className={linkClass}>Settings</NavLink>
              <div className="pt-3 border-t border-zinc-800">
                <button
                  onClick={handleLogout}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)} className={linkClass}>Login</NavLink>
              <NavLink
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400"
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
