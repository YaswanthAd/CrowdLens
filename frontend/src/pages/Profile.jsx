import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getUserProfile, getProfile, followUser, unfollowUser } from '../api/auth'
import { getReviews, getWatchlist } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import TitleCard from '../components/TitleCard'

// Small star display
function StarRating({ rating }) {
  if (!rating) return null
  return <span className="text-emerald-400 text-xs">{'★'.repeat(Math.round(rating))} {rating}/5</span>
}

export default function Profile() {
  const { username: paramUsername } = useParams()
  const { user: authUser, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reviews')

  const [reviews, setReviews] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [followLoading, setFollowLoading] = useState(false)

  // The username to display — either from URL param or the logged-in user
  const targetUsername = paramUsername || authUser?.username

  // If on /profile but not logged in, redirect
  useEffect(() => {
    if (!authLoading && !paramUsername && !authUser) {
      navigate('/login')
    }
  }, [authLoading, authUser, paramUsername, navigate])

  // Fetch the profile
  useEffect(() => {
    if (!targetUsername) return
    setLoading(true)

    // Use the public endpoint for any profile
    getUserProfile(targetUsername)
      .then((data) => {
        setProfile(data)
        document.title = `${data.display_name || data.username} — CrowdLens`
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [targetUsername])

  // Fetch this user's reviews
  useEffect(() => {
    if (!targetUsername) return
    getReviews({ user: targetUsername })
      .then((data) => setReviews(data.results ?? data ?? []))
      .catch(() => setReviews([]))
  }, [targetUsername])

  // Fetch watchlist — only if viewing own profile
  useEffect(() => {
    const isOwnProfile = !paramUsername || paramUsername === authUser?.username
    if (!isOwnProfile || !authUser) return
    getWatchlist()
      .then((data) => setWatchlist(data.results ?? data ?? []))
      .catch(() => setWatchlist([]))
  }, [paramUsername, authUser])

  async function handleFollow() {
    if (!authUser) {
      showToast('Log in to follow users', 'error')
      return
    }
    setFollowLoading(true)
    try {
      if (profile.is_followed_by_me) {
        await unfollowUser(profile.username)
        setProfile((p) => ({
          ...p,
          is_followed_by_me: false,
          followers_count: (p.followers_count || 1) - 1,
        }))
        showToast(`Unfollowed ${profile.username}`)
      } else {
        await followUser(profile.username)
        setProfile((p) => ({
          ...p,
          is_followed_by_me: true,
          followers_count: (p.followers_count || 0) + 1,
        }))
        showToast(`Following ${profile.username}!`)
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setFollowLoading(false)
    }
  }

  const isOwnProfile = !paramUsername || paramUsername === authUser?.username

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-zinc-800" />
          <div className="flex-1">
            <div className="h-6 bg-zinc-800 rounded w-40 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-zinc-400 text-lg mb-2">User not found</p>
          <Link to="/" className="text-emerald-400 text-sm">Go home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-300 uppercase shrink-0">
          {profile.username?.[0]}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-zinc-500 text-sm">@{profile.username}</p>
          {profile.bio && (
            <p className="text-zinc-400 text-sm mt-1">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 mt-2 text-sm text-zinc-500">
            <span>
              <span className="text-white font-medium">{profile.followers_count ?? 0}</span> followers
            </span>
            <span>
              <span className="text-white font-medium">{profile.following_count ?? 0}</span> following
            </span>
            {profile.reviews_count != null && (
              <span>
                <span className="text-white font-medium">{profile.reviews_count}</span> reviews
              </span>
            )}
          </div>
        </div>

        {/* Follow button — only show when viewing someone else */}
        {!isOwnProfile && authUser && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0 ${
              profile.is_followed_by_me
                ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            {followLoading ? '...' : profile.is_followed_by_me ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6 gap-1">
        {['reviews', 'watchlist'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'reviews' ? `Reviews (${reviews.length})` : 'Watchlist'}
          </button>
        ))}
      </div>

      {/* Reviews tab */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <p className="text-zinc-500 text-sm">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => {
                const title = review.title_detail || review.title
                const titleName = typeof title === 'object' ? title?.title : 'Unknown'
                const titleSlug = typeof title === 'object' ? title?.slug : null

                return (
                  <div key={review.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    {titleSlug && (
                      <Link
                        to={`/title/${titleSlug}`}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                      >
                        {titleName}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1 mb-2">
                      <StarRating rating={review.rating} />
                    </div>
                    {review.review_text && (
                      <p className="text-zinc-300 text-sm leading-relaxed">{review.review_text}</p>
                    )}
                    <p className="text-zinc-600 text-xs mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Watchlist tab */}
      {activeTab === 'watchlist' && (
        <div>
          {!isOwnProfile ? (
            <p className="text-zinc-500 text-sm">Watchlist is private.</p>
          ) : watchlist.length === 0 ? (
            <p className="text-zinc-500 text-sm">
              Your watchlist is empty.{' '}
              <Link to="/" className="text-emerald-400 hover:text-emerald-300">Browse titles</Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watchlist.map((item) => {
                const t = item.title_detail || item.title
                if (typeof t !== 'object') return null
                return <TitleCard key={item.id} title={t} />
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
