import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTitles } from '../api/titles'

export default function Trending() {
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Trending — CrowdLens'
    getTitles({ ordering: '-total_user_reviews', page_size: 25 })
      .then((d) => setTitles(d.results ?? d ?? []))
      .catch(() => setTitles([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/40 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 50% 100% at 80% 0%, rgba(52,211,153,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-14 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-emerald-400 animate-glow-pulse" />
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em]">Live Rankings</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
            Trending
          </h1>
          <p className="text-zinc-600 text-xs uppercase tracking-[0.2em] mt-3">
            Most reviewed titles on CrowdLens
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-6 py-5 border-b border-zinc-800/30">
                <div className="w-16 h-12 bg-zinc-900" />
                <div className="w-14 h-20 bg-zinc-900 shrink-0" />
                <div className="flex-1">
                  <div className="h-5 bg-zinc-900 w-2/3 mb-2" />
                  <div className="h-3 bg-zinc-900 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && titles.length === 0 && (
          <div className="py-32 text-center border border-zinc-800/40">
            <p className="text-zinc-600 text-xs uppercase tracking-[0.3em] mb-2">No titles yet</p>
            <p className="text-zinc-800 text-[10px] uppercase tracking-widest">
              Import titles and write reviews to see rankings
            </p>
          </div>
        )}

        {/* Rankings list */}
        {!loading && titles.length > 0 && (
          <div className="flex flex-col">
            {titles.map((title, index) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group flex items-center gap-5 md:gap-8 py-5 border-b border-zinc-800/30 hover:bg-zinc-900/30 px-4 -mx-4 transition-all duration-300 relative overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Giant rank number */}
                <div className="w-16 md:w-20 shrink-0 relative">
                  <span className="text-5xl md:text-7xl font-black text-zinc-900 leading-none tabular-nums group-hover:text-emerald-400/15 transition-colors duration-500 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Poster */}
                <div className="w-12 h-17 md:w-14 md:h-20 shrink-0 overflow-hidden bg-zinc-900 border border-zinc-800/60">
                  {title.poster_full_url ? (
                    <img
                      src={title.poster_full_url}
                      alt={title.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-zinc-800 text-[8px] uppercase">N/A</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm md:text-base truncate group-hover:text-emerald-400 transition-colors duration-300">
                    {title.title}
                  </p>
                  <p className="text-zinc-700 text-[10px] uppercase tracking-[0.2em] mt-1">
                    {[title.release_year, title.title_type].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {/* Review count badge */}
                <div className="shrink-0 text-right">
                  {title.total_user_reviews > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-white text-lg md:text-xl font-black tabular-nums">
                        {title.total_user_reviews}
                      </span>
                      <span className="text-zinc-700 text-[8px] uppercase tracking-[0.3em]">reviews</span>
                    </div>
                  )}
                </div>

                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 h-px bg-emerald-400/40 w-0 group-hover:w-full transition-all duration-700" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
