import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  useEffect(() => {
    document.title = '404 — CrowdLens'
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-8xl font-bold text-zinc-800 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-zinc-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
