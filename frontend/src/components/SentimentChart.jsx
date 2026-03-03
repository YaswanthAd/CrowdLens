import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getSentimentHistory } from '../api/sentiment'

export default function SentimentChart({ titleId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSentimentHistory(titleId, { period: 'daily' })
      .then((res) => setData(res.results ?? res ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [titleId])

  if (loading) {
    return <p className="text-zinc-500 text-sm py-6 text-center">Loading chart...</p>
  }

  if (!data.length) {
    return (
      <div className="bg-zinc-900 p-6 border border-zinc-800 text-center">
        <p className="text-zinc-500 text-xs uppercase tracking-[0.15em] font-medium">No trend data yet</p>
        <p className="text-zinc-700 text-[10px] uppercase tracking-[0.2em] mt-1">Scores appear once mentions are scraped</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 p-5 border border-zinc-800">
      <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-4">Sentiment Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '0px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#a1a1aa', fontSize: 12 }}
            itemStyle={{ color: '#34d399' }}
          />
          <Line
            type="monotone"
            dataKey="senti_score"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#34d399' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
