// Shows the sentiment breakdown bar + score for a title
export default function SentimentPanel({ title }) {
  const score = title?.senti_score
  const pos = title?.senti_positive_pct ?? 0
  const neg = title?.senti_negative_pct ?? 0
  const neu = Math.max(0, 100 - pos - neg)
  const mentions = title?.senti_total_mentions ?? 0

  // No data yet
  if (!score) {
    return (
      <div className="bg-zinc-900 p-5 border border-zinc-800 text-center py-8">
        <p className="text-zinc-500 text-xs uppercase tracking-[0.15em] font-medium">No sentiment data yet</p>
        <p className="text-zinc-700 text-[10px] uppercase tracking-[0.2em] mt-1">Powered by Reddit &amp; social media analysis</p>
      </div>
    )
  }

  const scoreColor =
    score >= 70 ? 'text-emerald-400' : score < 40 ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className="bg-zinc-900 p-5 border border-zinc-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Sentiment Score</h3>
          <p className="text-zinc-700 text-[10px] uppercase tracking-[0.15em] mt-1">Reddit &amp; social media</p>
        </div>
        <div className={`text-3xl font-black ${scoreColor}`}>{Math.round(score)}</div>
      </div>

      {/* Positive / Neutral / Negative bar */}
      <div className="flex overflow-hidden h-2 mb-4 bg-zinc-800">
        <div className="bg-emerald-500 h-full" style={{ width: `${pos}%` }} />
        <div className="bg-zinc-600 h-full" style={{ width: `${neu}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${neg}%` }} />
      </div>

      <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 inline-block" />
          {pos.toFixed(0)}% positive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-zinc-500 inline-block" />
          {neu.toFixed(0)}% neutral
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 inline-block" />
          {neg.toFixed(0)}% negative
        </span>
      </div>

      <p className="text-[10px] text-zinc-700 uppercase tracking-[0.15em]">
        {mentions.toLocaleString()} mentions analyzed
      </p>
    </div>
  )
}
