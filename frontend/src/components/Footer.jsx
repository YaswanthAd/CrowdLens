import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-white font-black text-xs uppercase tracking-[0.25em] hover:text-emerald-400 transition-colors"
          >
            CrowdLens
          </Link>
          <span className="text-zinc-800">·</span>
          <p className="text-zinc-700 text-[10px] uppercase tracking-widest">Sentiment-Powered Reviews</p>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="/api/v1/"
            className="text-zinc-700 text-[10px] uppercase tracking-widest hover:text-zinc-400 transition-colors"
          >
            API
          </a>
          <a
            href="https://github.com"
            className="text-zinc-700 text-[10px] uppercase tracking-widest hover:text-zinc-400 transition-colors"
          >
            GitHub
          </a>
          <span className="text-zinc-800 text-[10px] uppercase tracking-widest">© 2025</span>
        </div>
      </div>
    </footer>
  )
}
