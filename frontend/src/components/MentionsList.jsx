import { useState, useEffect } from 'react'
import { getMentions } from '../api/sentiment'

const FILTERS = ['all', 'positive', 'negative', 'neutral']

const sentimentStyles = {
  positive: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  negative: 'text-red-400 bg-red-400/10 border-red-400/20',
  neutral: 'text-zinc-500 bg-zinc-800 border-zinc-700',
}

export default function MentionsList({ titleId }) {
  const [mentions, setMentions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    setLoading(true)
    setVisibleCount(10)
    const params = {}
    if (filter !== 'all') params.sentiment = filter

    getMentions(titleId, params)
      .then((data) => setMentions(data.results ?? data ?? []))
      .catch(() => setMentions([]))
      .finally(() => setLoading(false))
  }, [titleId, filter])

  if (loading) {
    return <p className="text-zinc-500 text-sm py-6 text-center">Loading mentions...</p>
  }

  if (!mentions.length) {
    return <p className="text-zinc-500 text-sm py-6 text-center">No mentions found yet.</p>
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
              filter === f
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {mentions.slice(0, visibleCount).map((mention) => {
          const label = mention.sentiment_label || 'neutral'
          return (
            <div key={mention.id} className="bg-zinc-900 p-4 border border-zinc-800/60">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {mention.subreddit && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 border border-zinc-700 uppercase tracking-widest">
                        r/{mention.subreddit}
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 border uppercase tracking-widest font-bold ${
                        sentimentStyles[label] || sentimentStyles.neutral
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                    {mention.text || mention.content}
                  </p>
                </div>
                <div className="text-xs text-zinc-600 shrink-0 whitespace-nowrap">
                  ↑ {mention.upvotes ?? 0}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {mentions.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((c) => c + 10)}
          className="mt-4 w-full py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all"
        >
          Show more ({mentions.length - visibleCount} remaining)
        </button>
      )}
    </div>
  )
}
