import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Watchlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Watchlist — CrowdLens'
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user) {
      getWatchlist()
        .then((data) => setItems(data.results ?? data ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, navigate])

  async function handleRemove(id, titleName) {
    try {
      await removeFromWatchlist(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      showToast(`Removed "${titleName}" from watchlist`)
    } catch {
      showToast('Failed to remove', 'error')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">My Watchlist</h1>
      <p className="text-zinc-500 text-sm mb-8">
        {items.length} {items.length === 1 ? 'title' : 'titles'} saved
      </p>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 mb-3">Your watchlist is empty</p>
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm">
            Browse titles to add
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            // item.title can be an object (nested) or just an ID
            const title = item.title_detail || item.title
            const titleName = typeof title === 'object' ? title?.title : 'Unknown'
            const titleSlug = typeof title === 'object' ? title?.slug : null
            const posterUrl = typeof title === 'object' ? title?.poster_full_url : null

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800"
              >
                {/* Poster thumbnail */}
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={titleName}
                    className="w-10 h-14 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-zinc-800 rounded shrink-0" />
                )}

                {/* Title link */}
                <div className="flex-1 min-w-0">
                  {titleSlug ? (
                    <Link
                      to={`/title/${titleSlug}`}
                      className="text-white font-medium hover:text-emerald-400 transition-colors truncate block"
                    >
                      {titleName}
                    </Link>
                  ) : (
                    <p className="text-white font-medium truncate">{titleName}</p>
                  )}
                  {typeof title === 'object' && title?.release_year && (
                    <p className="text-zinc-500 text-xs">{title.release_year}</p>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id, titleName)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors shrink-0 px-2 py-1"
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
