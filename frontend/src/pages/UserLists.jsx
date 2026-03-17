import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserLists } from '../api/lists'
import { useAuth } from '../context/AuthContext'

function PosterCollage({ thumbnails }) {
  const filled = [...thumbnails, null, null, null, null].slice(0, 4)
  return (
    <div className="grid grid-cols-2 gap-0.5 w-24 h-24 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
      {filled.map((url, i) =>
        url ? (
          <img key={i} src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div key={i} className="w-full h-full bg-zinc-800" />
        )
      )}
    </div>
  )
}

export default function UserLists() {
  const { username } = useParams()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const isOwnProfile = user && user.username === username

  useEffect(() => {
    document.title = `${username}'s Lists — CrowdLens`
  }, [username])

  useEffect(() => {
    getUserLists(username)
      .then((data) => setLists(data.results ?? data ?? []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isOwnProfile ? 'My Lists' : `${username}'s Lists`}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
          </p>
        </div>
        {isOwnProfile && (
          <Link
            to="/lists/new"
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New List
          </Link>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 mb-3">
            {isOwnProfile ? "You haven't created any lists yet" : `${username} hasn't created any lists yet`}
          </p>
          {isOwnProfile && (
            <Link to="/lists/new" className="text-emerald-400 hover:text-emerald-300 text-sm">
              Create your first list
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lists.map((list, idx) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="flex items-center gap-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <PosterCollage thumbnails={list.poster_thumbnails || []} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-white font-semibold truncate hover:text-emerald-400 transition-colors">
                    {list.name}
                  </h3>
                  {!list.is_public && (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                      Private
                    </span>
                  )}
                  {list.is_ranked && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                      Ranked
                    </span>
                  )}
                </div>
                {list.description && (
                  <p className="text-zinc-500 text-xs truncate">{list.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-zinc-500 text-xs">
                  <span>{list.title_count} {list.title_count === 1 ? 'title' : 'titles'}</span>
                  <span>·</span>
                  <span>♥ {list.likes_count}</span>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  to={`/lists/${list.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors shrink-0 px-2 py-1"
                >
                  Edit
                </Link>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
