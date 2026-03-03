import { useState, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { getTitles, getGenres } from '../api/titles'
import TitleCard from '../components/TitleCard'
import SkeletonCard from '../components/SkeletonCard'

const PATH_TO_TYPE = {
  '/movies': 'movie',
  '/tv': 'tv',
  '/anime': 'anime',
}

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: '-release_date', label: 'Release Date' },
  { value: 'title', label: 'A–Z' },
]

export default function Browse() {
  const { pathname } = useLocation()
  const titleType = PATH_TO_TYPE[pathname] || 'movie'

  const [searchParams, setSearchParams] = useSearchParams()
  const [titles, setTitles] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)

  const selectedGenre = searchParams.get('genre') || ''
  const selectedSort = searchParams.get('ordering') || '-created_at'

  const TYPE_LABELS = { movie: 'Movies', tv: 'TV Shows', anime: 'Anime' }

  useEffect(() => {
    document.title = `${TYPE_LABELS[titleType]} — CrowdLens`
    setPage(1)
    setSearchParams({})
  }, [titleType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getGenres()
      .then((data) => setGenres(data.results ?? data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { title_type: titleType, ordering: selectedSort, page }
    if (selectedGenre) params.genre = selectedGenre

    getTitles(params)
      .then((data) => {
        setTitles(data.results ?? [])
        setCount(data.count ?? 0)
      })
      .catch(() => setTitles([]))
      .finally(() => setLoading(false))
  }, [titleType, selectedGenre, selectedSort, page])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
    setPage(1)
  }

  const totalPages = Math.ceil(count / 20)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Page header */}
      <div className="border-b border-zinc-800 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 0% 50%, rgba(52,211,153,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-6 bg-emerald-400" />
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em]">Browse</p>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                {TYPE_LABELS[titleType]}
              </h1>
            </div>
            {count > 0 && (
              <p className="text-zinc-600 text-sm tabular-nums hidden md:block">
                {count.toLocaleString()} titles
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <select
            value={selectedGenre}
            onChange={(e) => updateFilter('genre', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors hover:border-zinc-600"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.slug || g.name}>{g.name}</option>
            ))}
          </select>

          <select
            value={selectedSort}
            onChange={(e) => updateFilter('ordering', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors hover:border-zinc-600"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {count > 0 && (
            <p className="text-zinc-700 text-[10px] uppercase tracking-widest md:hidden ml-auto">
              {count.toLocaleString()}
            </p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 21 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : titles.length === 0 ? (
          <div className="py-32 text-center border border-zinc-800">
            <p className="text-zinc-600 text-xs uppercase tracking-[0.3em]">No titles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {titles.map((title) => (
              <TitleCard key={title.id} title={title} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-14">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-6 py-2.5 border border-zinc-800 text-zinc-500 disabled:opacity-30 hover:border-zinc-600 hover:text-white transition-colors text-[10px] uppercase tracking-[0.2em]"
            >
              ← Prev
            </button>
            <span className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2.5 border border-zinc-800 text-zinc-500 disabled:opacity-30 hover:border-zinc-600 hover:text-white transition-colors text-[10px] uppercase tracking-[0.2em]"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
