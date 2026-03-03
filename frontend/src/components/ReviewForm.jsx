import { useState } from 'react'
import { createReview } from '../api/reviews'
import { useToast } from '../context/ToastContext'

// Star rating picker that supports half-stars (0.5 increments)
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(null)
  const display = hover !== null ? hover : value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = display >= star
        const isHalf = display >= star - 0.5 && display < star

        return (
          <div
            key={star}
            className="relative w-8 h-8 cursor-pointer"
            onMouseLeave={() => setHover(null)}
          >
            {/* Hovering left half = half star */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star - 0.5)}
              onClick={() => onChange(star - 0.5)}
            />
            {/* Hovering right half = full star */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star)}
              onClick={() => onChange(star)}
            />
            <span
              className={`text-2xl select-none ${
                isFull
                  ? 'text-emerald-400'
                  : isHalf
                  ? 'text-emerald-300'
                  : 'text-zinc-700'
              }`}
            >
              ★
            </span>
          </div>
        )
      })}
      <span className="ml-2 text-sm text-zinc-400">
        {value ? `${value} / 5` : 'No rating yet'}
      </span>
    </div>
  )
}

// The full review form — only shown when the user is logged in
export default function ReviewForm({ titleId, onReviewPosted }) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) {
      showToast('Please pick a star rating first', 'error')
      return
    }
    setLoading(true)
    try {
      await createReview({
        title: titleId,
        rating,
        review_text: text,
        contains_spoilers: spoiler,
      })
      showToast('Review posted!')
      setRating(0)
      setText('')
      setSpoiler(false)
      onReviewPosted?.() // tell parent to refresh the reviews list
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to post review'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <h3 className="text-white font-semibold mb-4">Write a Review</h3>

      <div className="mb-4">
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Rating</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Review (optional)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Share your thoughts..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={spoiler}
            onChange={(e) => setSpoiler(e.target.checked)}
            className="w-4 h-4 accent-emerald-500"
          />
          Contains spoilers
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Posting...' : 'Post Review'}
        </button>
      </div>
    </form>
  )
}
