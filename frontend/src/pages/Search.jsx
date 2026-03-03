import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTitles } from '../api/titles'
import TitleCard from '../components/TitleCard'
import SkeletonCard from '../components/SkeletonCard'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceTimer = useRef(null)

  useEffect(() => {
    document.title = query ? `"${query}" — CrowdLens` : 'Search — CrowdLens'
  }, [query])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      runSearch(q)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function runSearch(q) {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    getTitles({ search: q.trim(), page_size: 40 })
      .then((data) => setResults(data.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  function handleInputChange(e) {
    const val = e.target.value
    setQuery(val)
    if (val.trim()) setSearchParams({ q: val.trim() })
    else setSearchParams({})

    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => runSearch(val), 400)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/40 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(52,211,153,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-14 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-emerald-400" />
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              Search
            </h1>
          </div>

          {/* Search input */}
          <div className="flex max-w-2xl mt-8">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Movies, TV shows, anime..."
                autoFocus
                className="w-full bg-zinc-900/60 border border-zinc-700/60 border-r-0 px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/60 text-sm backdrop-blur-sm"
              />
              {/* Live typing indicator */}
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700/60 px-5 flex items-center backdrop-blur-sm min-w-15 justify-center">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest tabular-nums">
                {loading ? '—' : searched ? results.length : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 14 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-4xl font-black text-zinc-900 uppercase tracking-tight mb-4">No results</p>
            <p className="text-zinc-700 text-xs uppercase tracking-[0.2em]">
              Nothing found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {results.map((title, i) => (
              <div
                key={title.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TitleCard title={title} />
              </div>
            ))}
          </div>
        )}

        {/* Initial empty state */}
        {!loading && !searched && (
          <div className="py-32 text-center">
            <div className="inline-flex items-center gap-3 text-zinc-800">
              <span className="text-4xl">⌘</span>
            </div>
            <p className="text-zinc-700 text-xs uppercase tracking-[0.3em] mt-4">
              Start typing to search all titles
            </p>
            <div className="flex justify-center gap-3 mt-8">
              {['Movies', 'TV Shows', 'Anime'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setQuery(t)
                    runSearch(t)
                    setSearchParams({ q: t })
                  }}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700 border border-zinc-800/60 px-4 py-2 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
