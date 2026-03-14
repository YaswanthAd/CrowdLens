import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getLists } from '../api/lists'

function PosterCollage({ thumbnails }) {
  const filled = [...thumbnails, null, null, null, null].slice(0, 4)
  return (
    <div className="grid grid-cols-2 gap-0.5 w-full aspect-square rounded-t-xl overflow-hidden bg-zinc-800">
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

function ListCard({ list }) {
  return (
    <Link
      to={`/lists/${list.id}`}
      className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors animate-fade-in-up"
    >
      <PosterCollage thumbnails={list.poster_thumbnails || []} />

      <div className="p-4">
        <h3 className="text-white font-semibold truncate group-hover:text-emerald-400 transition-colors">
          {list.name}
        </h3>
        {list.description && (
          <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{list.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={list.user?.avatar_url}
              alt={list.user?.display_name || list.user?.username}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
            <span className="text-zinc-500 text-xs truncate">
              {list.user?.display_name || list.user?.username}
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-xs shrink-0 ml-2">
            <span>{list.title_count} {list.title_count === 1 ? 'title' : 'titles'}</span>
            <span>♥ {list.likes_count}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Lists() {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Lists — CrowdLens'
  }, [])

  useEffect(() => {
    getLists()
      .then((data) => setLists(data.results ?? data ?? []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse">
              <div className="aspect-square bg-zinc-800 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Public Lists</h1>
          <p className="text-zinc-500 text-sm mt-1">Curated collections by the community</p>
        </div>
        <Link
          to="/lists/new"
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New List
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 mb-3">No public lists yet</p>
          <Link to="/lists/new" className="text-emerald-400 hover:text-emerald-300 text-sm">
            Be the first to create one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  )
}
