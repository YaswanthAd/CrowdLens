import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getTitles } from '../api/titles'
import TitleCard from '../components/TitleCard'
import SkeletonCard from '../components/SkeletonCard'

/* ── Horizontal scroll row ── */
function TitleRow({ label, type, to, delay = 0 }) {
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const rowRef = useRef(null)

  useEffect(() => {
    getTitles({ title_type: type, ordering: '-created_at', page_size: 20 })
      .then((d) => setTitles(d.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type])

  function scroll(dir) {
    rowRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <div
      className="py-10 border-b border-zinc-800/40 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="max-w-400 mx-auto px-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-1 h-5 bg-emerald-400" />
            <p className="text-white font-black text-lg uppercase tracking-tight">{label}</p>
            <span className="text-zinc-700 text-[10px] tracking-[0.3em] uppercase font-bold">
              {!loading && `${titles.length} titles`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={to}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 hover:text-emerald-400 transition-colors"
            >
              View all →
            </Link>
            <div className="flex gap-px">
              <button
                onClick={() => scroll(-1)}
                className="w-8 h-8 bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center text-sm"
              >
                ‹
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-8 h-8 bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center text-sm"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-2"
        >
          {loading
            ? Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[130px] sm:w-[150px]">
                  <SkeletonCard />
                </div>
              ))
            : titles.map((title, i) => (
                <div
                  key={title.id}
                  className="shrink-0 w-[130px] sm:w-[150px] animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <TitleCard title={title} />
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}

/* ── Marquee ticker ── */
function MarqueeTicker({ titles }) {
  if (!titles.length) return null
  const doubled = [...titles, ...titles]
  return (
    <div className="border-y border-zinc-800/40 overflow-hidden bg-zinc-900/30 py-4">
      <div className="animate-marquee flex whitespace-nowrap gap-10">
        {doubled.map((t, i) => (
          <Link
            key={`${t.id}-${i}`}
            to={`/title/${t.slug}`}
            className="flex items-center gap-3 text-zinc-500 hover:text-emerald-400 transition-colors shrink-0"
          >
            <span className="text-emerald-400 text-[6px]">◆</span>
            <span className="text-xs font-bold uppercase tracking-[0.12em]">{t.title}</span>
            {t.release_year && (
              <span className="text-[10px] text-zinc-700 tracking-wider font-medium">{t.release_year}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Featured spotlight ── */
function FeaturedSpotlight({ title }) {
  if (!title) return null
  const backdrop = title.backdrop_full_url || title.poster_full_url

  return (
    <Link
      to={`/title/${title.slug}`}
      className="group block relative h-80 md:h-112 overflow-hidden border-b border-zinc-800/40"
    >
      {backdrop && (
        <img
          src={backdrop}
          alt={title.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-zinc-950/40" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-5xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-emerald-400 animate-glow-pulse" />
          <span className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.35em]">Featured</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-2 drop-shadow-lg group-hover:text-emerald-400 transition-colors duration-300">
          {title.title}
        </h2>
        <p className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-4">
          {[title.release_year, title.title_type].filter(Boolean).join(' · ')}
        </p>
        {title.genres?.length > 0 && (
          <div className="hidden md:flex gap-2 mt-2">
            {title.genres.slice(0, 4).map((g) => (
              <span key={g.id} className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 border border-zinc-600/40 px-2 py-0.5">
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

/* ── Main Home ── */
export default function Home() {
  const [query, setQuery] = useState('')
  const [trending, setTrending] = useState([])
  const [featured, setFeatured] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const heroRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'CrowdLens — Sentiment-Powered Reviews'
    getTitles({ ordering: '-total_user_reviews', page_size: 30 })
      .then((d) => {
        const results = d.results ?? []
        setTrending(results)
        // Prefer titles with backdrop, fall back to any with poster
        const withBackdrop = results.filter((t) => t.backdrop_full_url)
        const pool = withBackdrop.length > 0 ? withBackdrop : results.filter((t) => t.poster_full_url)
        if (pool.length > 0) {
          setFeatured(pool[Math.floor(Math.random() * Math.min(pool.length, 5))])
        }
      })
      .catch(() => {})
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="bg-zinc-950 min-h-screen">

      {/* ── HERO with cursor glow + noise ── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden border-b border-zinc-800 noise-overlay"
      >
        {/* Cursor-following glow */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(52,211,153,0.08) 0%, transparent 60%)`,
          }}
        />
        {/* Static atmospheric glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(52,211,153,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 md:py-44">
          <div className="flex items-center gap-2 mb-8 animate-fade-in-up">
            <div className="w-2 h-2 bg-emerald-400 animate-glow-pulse" />
            <div className="w-6 h-px bg-emerald-400/60" />
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.35em]">
              Sentiment-Powered Reviews
            </p>
          </div>

          <h1
            className="text-6xl md:text-[8rem] font-black text-white leading-[0.85] tracking-tighter mb-8 uppercase animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            What is<br />
            the crowd<br />
            <span className="text-emerald-400 relative">
              saying
              <span className="text-zinc-600">?</span>
            </span>
          </h1>

          <p
            className="text-zinc-500 text-base md:text-lg mb-10 max-w-md leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Real audience sentiment for movies, TV, and anime.
            Not star ratings — actual <span className="text-zinc-300">crowd intelligence</span>.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex max-w-lg animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a title..."
              className="flex-1 bg-zinc-900/60 border border-zinc-700/60 border-r-0 px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 text-sm backdrop-blur-sm"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-7 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all shrink-0 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]"
            >
              Search
            </button>
          </form>

          {/* Quick stats */}
          <div
            className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-zinc-800/40 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            {[
              { label: 'Engine', value: 'VADER NLP' },
              { label: 'Score', value: '0 – 100' },
              { label: 'Sources', value: 'User Reviews' },
              { label: 'Updates', value: 'Real-time' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-zinc-700 text-[8px] uppercase tracking-[0.3em] mb-1">{label}</p>
                <p className="text-zinc-300 text-[11px] font-bold uppercase tracking-wider">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE TICKER ── */}
      <MarqueeTicker titles={trending} />

      {/* ── FEATURED SPOTLIGHT ── */}
      <FeaturedSpotlight title={featured} />

      {/* ── TITLE ROWS ── */}
      <TitleRow label="Movies" type="movie" to="/movies" delay={0} />
      <TitleRow label="TV Shows" type="tv" to="/tv" delay={100} />
      <TitleRow label="Anime" type="anime" to="/anime" delay={200} />

      {/* ── HOW IT WORKS ── */}
      <section className="border-b border-zinc-800/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-1 h-6 bg-emerald-400" />
            <p className="text-white font-black text-xl uppercase tracking-tight">How SentiScore Works</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/60">
            {[
              {
                num: '01',
                title: 'Collect',
                body: 'We aggregate user reviews and public discussions about every title in our library.',
                icon: '◎',
              },
              {
                num: '02',
                title: 'Analyze',
                body: 'VADER NLP scores each piece of text on a full sentiment spectrum — positive, negative, neutral.',
                icon: '◈',
              },
              {
                num: '03',
                title: 'Score',
                body: 'Individual scores are engagement-weighted to produce a final 0–100 SentiScore per title.',
                icon: '◆',
              },
            ].map(({ num, title, body, icon }) => (
              <div key={num} className="bg-zinc-950 p-10 group hover:bg-zinc-900/40 transition-all duration-500 relative overflow-hidden">
                {/* Background number */}
                <span className="absolute -top-4 -right-2 text-[120px] font-black text-zinc-900/40 leading-none select-none pointer-events-none group-hover:text-emerald-400/5 transition-colors duration-700">
                  {num}
                </span>
                <p className="text-emerald-400 text-lg mb-6 relative z-10">{icon}</p>
                <p className="text-white font-black text-2xl uppercase tracking-tight mb-3 relative z-10 group-hover:text-emerald-400 transition-colors">{title}</p>
                <p className="text-zinc-500 text-sm leading-relaxed relative z-10">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY TYPE ── */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-1 h-6 bg-emerald-400" />
            <p className="text-white font-black text-xl uppercase tracking-tight">Browse by Type</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Movies', to: '/movies', desc: 'Feature films from around the world', count: '∞' },
              { label: 'TV Shows', to: '/tv', desc: 'Series, miniseries, and documentaries', count: '∞' },
              { label: 'Anime', to: '/anime', desc: 'Japanese animation — subbed and dubbed', count: '∞' },
            ].map(({ label, to, desc, count }) => (
              <Link
                key={to}
                to={to}
                className="group relative border border-zinc-800/60 hover:border-emerald-500/40 p-8 transition-all duration-500 overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'radial-gradient(ellipse 80% 80% at 50% 100%, rgba(52,211,153,0.08) 0%, transparent 70%)',
                  }}
                />
                <span className="absolute top-3 right-4 text-zinc-800 text-[10px] font-black tracking-[0.3em] group-hover:text-emerald-400/30 transition-colors duration-500">
                  {count}
                </span>
                <p className="relative text-white font-black text-3xl uppercase tracking-tight group-hover:text-emerald-400 transition-colors duration-300 mb-2">
                  {label}
                </p>
                <p className="relative text-zinc-600 text-xs leading-relaxed">{desc}</p>
                <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-emerald-400 text-[10px] uppercase tracking-[0.2em] font-bold">Explore</span>
                  <span className="text-emerald-400 text-xs">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
