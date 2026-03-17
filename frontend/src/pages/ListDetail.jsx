import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getList, deleteList, likeList, unlikeList } from '../api/lists'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ListDetail() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    getList(id)
      .then((data) => {
        setList(data)
        document.title = `${data.name} — CrowdLens`
      })
      .catch(() => navigate('/lists'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleLike() {
    if (!user) { navigate('/login'); return }
    if (liking) return
    setLiking(true)
    try {
      if (list.is_liked_by_me) {
        const res = await unlikeList(id)
        setList((prev) => ({ ...prev, likes_count: res.likes_count, is_liked_by_me: false }))
      } else {
        const res = await likeList(id)
        setList((prev) => ({ ...prev, likes_count: res.likes_count, is_liked_by_me: true }))
      }
    } catch {
      showToast('Failed to update like', 'error')
    } finally {
      setLiking(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteList(id)
      showToast('List deleted')
      navigate('/lists')
    } catch {
      showToast('Failed to delete list', 'error')
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-zinc-900 rounded w-1/3 mb-4" />
        <div className="h-4 bg-zinc-900 rounded w-1/4 mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!list) return null

  const isOwner = user && user.username === list.user?.username
  const entries = list.entries || []

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          title="Delete List"
          message={`Are you sure you want to delete "${list.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="min-h-screen bg-zinc-950 max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {!list.is_public && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    Private
                  </span>
                )}
                {list.is_ranked && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    Ranked
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white break-words">{list.name}</h1>
              {list.description && (
                <p className="text-zinc-400 text-sm mt-2">{list.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <img
                  src={list.user?.avatar_url}
                  alt={list.user?.username}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <Link
                  to={`/user/${list.user?.username}`}
                  className="text-zinc-400 text-sm hover:text-emerald-400 transition-colors"
                >
                  {list.user?.display_name || list.user?.username}
                </Link>
                <span className="text-zinc-600 text-sm">·</span>
                <span className="text-zinc-500 text-sm">
                  {entries.length} {entries.length === 1 ? 'title' : 'titles'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  list.is_liked_by_me
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{list.is_liked_by_me ? '♥' : '♡'}</span>
                <span>{list.likes_count}</span>
              </button>
              {isOwner && (
                <>
                  <Link
                    to={`/lists/${id}/edit`}
                    className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="text-xs bg-zinc-900 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 px-3 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 mb-3">This list has no titles yet</p>
            {isOwner && (
              <Link to={`/lists/${id}/edit`} className="text-emerald-400 hover:text-emerald-300 text-sm">
                Add some titles
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {entries.map((entry, idx) => {
              const title = entry.title_info
              return (
                <Link
                  key={entry.id}
                  to={`/title/${title?.slug}`}
                  className="group relative block animate-fade-in-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    {list.is_ranked && (
                      <span className="absolute top-2 left-2 z-10 text-xs font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    )}
                    {title?.poster_full_url ? (
                      <img
                        src={title.poster_full_url}
                        alt={title.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center">
                        <span className="text-zinc-600 text-xs text-center px-2">{title?.title}</span>
                      </div>
                    )}
                    {/* Shine */}
                    <div className="shine-effect absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <p className="text-zinc-300 text-xs mt-2 truncate group-hover:text-emerald-400 transition-colors">
                    {title?.title}
                  </p>
                  {entry.notes && (
                    <p className="text-zinc-600 text-xs truncate">{entry.notes}</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
