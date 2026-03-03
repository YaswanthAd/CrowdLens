import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTitle } from '../api/titles'
import { getReviews, likeReview, unlikeReview, getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ReviewForm from '../components/ReviewForm'
import SentimentPanel from '../components/SentimentPanel'
import SentimentChart from '../components/SentimentChart'
import MentionsList from '../components/MentionsList'

/* Strip HTML tags from overview text, turn <br> into newlines */
function cleanOverview(html) {
  if (!html) return []
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function StarRating({ rating }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="text-emerald-400 text-sm tracking-wider">
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
    </span>
  )
}

function ReviewCard({ review, onLike }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(review.is_liked_by_user ?? false)
  const [likes, setLikes] = useState(review.likes_count ?? 0)
  const [spoilerOpen, setSpoilerOpen] = useState(false)

  async function handleLike() {
    if (!user) return
    try {
      if (liked) {
        await unlikeReview(review.id)
        setLiked(false)
        setLikes((l) => l - 1)
      } else {
        await likeReview(review.id)
        setLiked(true)
        setLikes((l) => l + 1)
      }
      onLike?.()
    } catch {
      // silently fail
    }
  }

  const reviewer = review.user || {}

  return (
    <div className="border-b border-zinc-800/40 py-6 last:border-0 group/review">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/user/${reviewer.username}`}
            className="w-9 h-9 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 uppercase shrink-0 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
          >
            {reviewer.username?.[0] || '?'}
          </Link>
          <div>
            <Link to={`/user/${reviewer.username}`} className="text-white text-sm font-bold hover:text-emerald-400 transition-colors">
              {reviewer.display_name || reviewer.username}
            </Link>
            <div className="mt-0.5">
              <StarRating rating={review.rating} />
            </div>
          </div>
        </div>
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest shrink-0">
          {new Date(review.created_at).toLocaleDateString()}
        </p>
      </div>

      {review.review_text && (
        <div className="ml-12">
          {review.contains_spoilers && !spoilerOpen ? (
            <button
              onClick={() => setSpoilerOpen(true)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400 bg-yellow-400/5 px-3 py-2 border border-yellow-400/20 hover:bg-yellow-400/10 transition-colors"
            >
              ⚠ Spoilers — click to reveal
            </button>
          ) : (
            <p className="text-zinc-400 text-sm leading-relaxed">{review.review_text}</p>
          )}
        </div>
      )}

      <div className="mt-3 ml-12">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 transition-all ${
            liked ? 'text-emerald-400' : 'text-zinc-700 hover:text-zinc-400'
          }`}
        >
          ♥ {likes > 0 ? likes : ''}
        </button>
      </div>
    </div>
  )
}

export default function TitleDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [title, setTitle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [watchlistEntry, setWatchlistEntry] = useState(null)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    setLoading(true)
    getTitle(slug)
      .then((data) => {
        setTitle(data)
        document.title = `${data.title} — CrowdLens`
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [slug])

  const fetchReviews = useCallback(() => {
    if (!title) return
    setReviewsLoading(true)
    getReviews({ title: title.id })
      .then((data) => setReviews(data.results ?? data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false))
  }, [title])

  useEffect(() => {
    if (title) fetchReviews()
  }, [title, fetchReviews])

  useEffect(() => {
    if (!user || !title) return
    getWatchlist()
      .then((data) => {
        const items = data.results ?? data ?? []
        const found = items.find((item) => {
          const t = item.title_detail || item.title
          const id = typeof t === 'object' ? t?.id : t
          return id === title.id
        })
        setWatchlistEntry(found || null)
      })
      .catch(() => {})
  }, [user, title])

  async function handleWatchlist() {
    if (!user) {
      showToast('Log in to add to your watchlist', 'error')
      return
    }
    setWatchlistLoading(true)
    try {
      if (watchlistEntry) {
        await removeFromWatchlist(watchlistEntry.id)
        setWatchlistEntry(null)
        showToast('Removed from watchlist')
      } else {
        const entry = await addToWatchlist({ title: title.id })
        setWatchlistEntry(entry)
        showToast('Added to watchlist!')
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Something went wrong', 'error')
    } finally {
      setWatchlistLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 animate-pulse">
        <div className="h-80 bg-zinc-900 w-full" />
        <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-10">
          <div className="flex gap-8">
            <div className="w-44 shrink-0 aspect-2/3 bg-zinc-800 border border-zinc-700" />
            <div className="flex-1 flex flex-col gap-3 pt-8">
              <div className="h-8 bg-zinc-800 w-2/3" />
              <div className="h-4 bg-zinc-800 w-1/3" />
              <div className="h-4 bg-zinc-800 w-full mt-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !title) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-6xl font-black text-zinc-900 uppercase mb-4">404</p>
          <p className="text-white text-lg font-black uppercase mb-2">Not Found</p>
          <p className="text-zinc-600 text-xs uppercase tracking-[0.2em] mb-8">
            No title matches &ldquo;{slug}&rdquo;
          </p>
          <Link to="/" className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-emerald-400/40 px-5 py-2.5 hover:bg-emerald-400 hover:text-zinc-950 transition-all">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  const backdropUrl = title.backdrop_full_url
    || (title.backdrop_path ? `https://image.tmdb.org/t/p/w1280${title.backdrop_path}` : null)

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}` },
  ]

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Cinematic backdrop ── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/20" />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950/80 via-transparent to-transparent" />
        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay" />
      </div>

      {/* ── Title info — overlaps backdrop ── */}
      <div className="max-w-5xl mx-auto px-6 -mt-44 md:-mt-52 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Poster */}
          <div className="shrink-0 w-36 md:w-48 mx-auto md:mx-0">
            {title.poster_full_url ? (
              <img
                src={title.poster_full_url}
                alt={title.title}
                className="w-full border border-zinc-800 shadow-2xl shadow-zinc-950/80"
              />
            ) : (
              <div className="aspect-2/3 bg-zinc-900 border border-zinc-800" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-16">
            {/* Type badge */}
            {title.title_type && (
              <span className="inline-block text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 mb-3">
                {title.title_type}
              </span>
            )}

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-2 uppercase">
              {title.title}
            </h1>

            <p className="text-zinc-600 text-[10px] mb-5 uppercase tracking-[0.2em]">
              {[title.release_year, title.runtime_minutes ? `${title.runtime_minutes}m` : null]
                .filter(Boolean).join(' · ')}
            </p>

            {/* Genres */}
            {title.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {title.genres.map((g) => (
                  <span key={g.id} className="text-[10px] text-zinc-500 border border-zinc-800/60 px-2.5 py-1 uppercase tracking-[0.15em] font-medium hover:border-zinc-600 transition-colors">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleWatchlist}
                disabled={watchlistLoading}
                className={`group/btn px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 ${
                  watchlistEntry
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]'
                }`}
              >
                {watchlistLoading ? '...' : watchlistEntry ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-zinc-800/40 mt-10 mb-8 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-10 pb-16">
            {title.overview && (
              <div className="animate-fade-in-up">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">Synopsis</h2>
                <div className="text-zinc-400 leading-relaxed max-w-3xl space-y-4">
                  {cleanOverview(title.overview).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {title.directors?.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">
                  {title.directors.length === 1 ? 'Director' : 'Directors'}
                </h2>
                <p className="text-zinc-300 text-sm font-medium">{title.directors.map((d) => d.name).join(', ')}</p>
              </div>
            )}

            {title.title_cast?.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-5">Cast</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                  {title.title_cast.slice(0, 12).map((member) => (
                    <div key={member.id} className="shrink-0 w-20 text-center group/cast">
                      {(member.person?.profile_image || member.person?.profile_path) ? (
                        <img
                          src={member.person.profile_image || `https://image.tmdb.org/t/p/w185${member.person.profile_path}`}
                          alt={member.person.name}
                          className="w-full aspect-square object-cover bg-zinc-900 mb-1.5 border border-zinc-800/60 group-hover/cast:border-zinc-600 transition-colors"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-zinc-900 border border-zinc-800/60 mb-1.5 flex items-center justify-center text-zinc-800 text-lg">?</div>
                      )}
                      <p className="text-white text-[10px] font-bold leading-tight truncate uppercase">{member.person?.name}</p>
                      <p className="text-zinc-700 text-[9px] truncate">{member.character_name || member.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {title.studio && (
              <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">Studio</h2>
                <p className="text-zinc-300 text-sm font-medium">{title.studio}</p>
              </div>
            )}

            {/* ── Sentiment section ── */}
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-5">Crowd Sentiment</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <SentimentPanel title={title} />
                <SentimentChart titleId={title.id} />
              </div>
            </div>

            {/* ── Mentions ── */}
            <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-5">Social Mentions</h2>
              <MentionsList titleId={title.id} />
            </div>
          </div>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === 'reviews' && (
          <div className="pb-16">
            {user ? (
              <div className="mb-8 pb-8 border-b border-zinc-800/40">
                <ReviewForm titleId={title.id} onReviewPosted={fetchReviews} />
              </div>
            ) : (
              <p className="text-zinc-600 text-sm mb-8 pb-8 border-b border-zinc-800/40">
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold">Log in</Link> to write a review.
              </p>
            )}

            {reviewsLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-24 bg-zinc-900/60 border border-zinc-800/30" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center border border-zinc-800/30">
                <p className="text-zinc-800 text-3xl font-black uppercase mb-2">No reviews</p>
                <p className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">Be the first to share your thoughts</p>
              </div>
            ) : (
              <div>
                {reviews.map((review, i) => (
                  <div key={review.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <ReviewCard review={review} onLike={fetchReviews} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
