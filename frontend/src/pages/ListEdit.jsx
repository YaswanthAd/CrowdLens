import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getList, updateList, addListEntry, removeListEntry, reorderListEntries } from '../api/lists'
import { getTitles } from '../api/titles'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function Toggle({ value, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 cursor-pointer">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && <p className="text-zinc-500 text-xs mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-zinc-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

export default function ListEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()

  // List metadata
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isRanked, setIsRanked] = useState(false)

  // Entries (ordered)
  const [entries, setEntries] = useState([])

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)

  // Save states
  const [savingMeta, setSavingMeta] = useState(false)
  const [loading, setLoading] = useState(true)

  // Drag state (refs to avoid re-renders)
  const dragIndex = useRef(null)
  const dragOverIndex = useRef(null)

  useEffect(() => {
    document.title = 'Edit List — CrowdLens'
  }, [])

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    if (!user) return
    getList(id)
      .then((data) => {
        if (data.user?.username !== user.username) {
          navigate(`/lists/${id}`)
          return
        }
        setName(data.name)
        setDescription(data.description || '')
        setIsPublic(data.is_public)
        setIsRanked(data.is_ranked)
        setEntries(data.entries || [])
      })
      .catch(() => navigate('/lists'))
      .finally(() => setLoading(false))
  }, [id, user, authLoading, navigate])

  // Search titles with debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await getTitles({ search: searchQuery, page_size: 8 })
        setSearchResults(data.results ?? [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSaveMeta(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSavingMeta(true)
    try {
      await updateList(id, { name: name.trim(), description, is_public: isPublic, is_ranked: isRanked })
      showToast('List updated!')
    } catch {
      showToast('Failed to save changes', 'error')
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleAddTitle(title) {
    // Prevent duplicate
    if (entries.some((e) => e.title === title.id || e.title_info?.id === title.id)) {
      showToast('Already in list')
      return
    }
    try {
      const entry = await addListEntry(id, { title: title.id })
      setEntries((prev) => [...prev, entry])
      setSearchQuery('')
      setSearchResults([])
      setShowSearch(false)
      showToast(`Added "${title.title}"`)
    } catch {
      showToast('Failed to add title', 'error')
    }
  }

  async function handleRemoveEntry(entryId, titleName) {
    try {
      await removeListEntry(id, entryId)
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
      showToast(`Removed "${titleName}"`)
    } catch {
      showToast('Failed to remove title', 'error')
    }
  }

  // Drag and drop
  function onDragStart(idx) {
    dragIndex.current = idx
  }

  function onDragOver(e, idx) {
    e.preventDefault()
    dragOverIndex.current = idx
  }

  async function onDrop() {
    const from = dragIndex.current
    const to = dragOverIndex.current
    if (from === null || to === null || from === to) return

    const reordered = [...entries]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setEntries(reordered)

    dragIndex.current = null
    dragOverIndex.current = null

    try {
      await reorderListEntries(id, reordered.map((e) => e.id))
    } catch {
      showToast('Failed to save order', 'error')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-2xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-zinc-900 rounded w-1/3 mb-6" />
        <div className="h-12 bg-zinc-900 rounded mb-3" />
        <div className="h-24 bg-zinc-900 rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Edit List</h1>
        <Link
          to={`/lists/${id}`}
          className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          ← View List
        </Link>
      </div>

      {/* Metadata form */}
      <form onSubmit={handleSaveMeta} className="flex flex-col gap-4 mb-10">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
            List Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Toggle value={isPublic} onChange={setIsPublic} label="Public" description="Anyone can see this list" />
          <Toggle value={isRanked} onChange={setIsRanked} label="Ranked" description="Show position numbers" />
        </div>

        <button
          type="submit"
          disabled={savingMeta || !name.trim()}
          className="self-end bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          {savingMeta ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Add titles section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Titles
          <span className="text-zinc-500 text-sm font-normal ml-2">({entries.length})</span>
        </h2>

        {/* Search box */}
        <div ref={searchRef} className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search to add a title…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {showSearch && (searchResults.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              {searching && (
                <p className="text-zinc-500 text-sm px-4 py-3">Searching…</p>
              )}
              {searchResults.map((title) => (
                <button
                  key={title.id}
                  onClick={() => handleAddTitle(title)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                >
                  {title.poster_full_url ? (
                    <img src={title.poster_full_url} alt={title.title} className="w-8 h-11 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-8 h-11 bg-zinc-800 rounded shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{title.title}</p>
                    <p className="text-zinc-500 text-xs">
                      {title.release_date?.slice(0, 4)} · {title.title_type}
                    </p>
                  </div>
                  <span className="ml-auto text-emerald-400 text-xs shrink-0">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Entries list with drag-and-drop */}
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-500 text-sm">No titles added yet. Search above to add some.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, idx) => {
              const title = entry.title_info
              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={onDrop}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors"
                >
                  {/* Drag handle */}
                  <div className="flex flex-col gap-0.5 shrink-0 opacity-40 hover:opacity-70 transition-opacity">
                    <div className="w-4 h-0.5 bg-zinc-400 rounded" />
                    <div className="w-4 h-0.5 bg-zinc-400 rounded" />
                    <div className="w-4 h-0.5 bg-zinc-400 rounded" />
                  </div>

                  {/* Rank number if ranked */}
                  {isRanked && (
                    <span className="text-zinc-500 text-xs font-mono w-5 text-center shrink-0">
                      {idx + 1}
                    </span>
                  )}

                  {/* Poster */}
                  {title?.poster_full_url ? (
                    <img
                      src={title.poster_full_url}
                      alt={title.title}
                      className="w-8 h-11 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-11 bg-zinc-800 rounded shrink-0" />
                  )}

                  {/* Title info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{title?.title}</p>
                    <p className="text-zinc-500 text-xs">{title?.release_date?.slice(0, 4)}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveEntry(entry.id, title?.title)}
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
    </div>
  )
}
