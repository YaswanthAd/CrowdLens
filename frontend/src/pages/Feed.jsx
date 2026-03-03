import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getFeed } from '../api/reviews'
import { useAuth } from '../context/AuthContext'

// Format a date relative to now (e.g. "2 hours ago")
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function Feed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Feed — CrowdLens'
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user) {
      getFeed()
        .then((data) => setActivities(data.results ?? data ?? []))
        .catch(() => setActivities([]))
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, navigate])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-2xl mx-auto px-4 py-10">
        <div className="animate-pulse flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 rounded-xl border border-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Activity Feed</h1>
      <p className="text-zinc-500 text-sm mb-8">Activity from people you follow</p>

      {activities.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 mb-2">Nothing here yet</p>
          <p className="text-zinc-600 text-sm">Follow other users to see their activity</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((activity) => {
            const actor = activity.actor || activity.user
            const title = activity.title
            const actionType = activity.action_type || activity.activity_type

            return (
              <div
                key={activity.id}
                className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800 flex items-center gap-3"
              >
                {/* User avatar placeholder */}
                <div className="w-8 h-8 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center text-xs font-medium text-zinc-400 uppercase">
                  {actor?.username?.[0] || '?'}
                </div>

                <div className="flex-1 min-w-0 text-sm">
                  <span>
                    <Link
                      to={`/user/${actor?.username}`}
                      className="text-white font-medium hover:text-emerald-400 transition-colors"
                    >
                      {actor?.username || 'Unknown'}
                    </Link>{' '}
                    <span className="text-zinc-400">
                      {actionType === 'review' ? 'reviewed' : 'added to watchlist'}
                    </span>{' '}
                    {title && (
                      <Link
                        to={`/title/${title.slug}`}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {title.title}
                      </Link>
                    )}
                  </span>
                </div>

                <span className="text-zinc-600 text-xs shrink-0">{timeAgo(activity.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
