import { Link } from 'react-router-dom'

const TYPE_BADGE = { movie: 'Film', tv: 'TV', anime: 'ANI' }

export default function TitleCard({ title }) {
  return (
    <Link to={`/title/${title.slug}`} className="group block relative aspect-2/3 overflow-hidden bg-zinc-900">
      {/* Poster image */}
      {title.poster_full_url ? (
        <img
          src={title.poster_full_url}
          alt={title.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="text-zinc-700 text-xs text-center px-3 leading-snug font-medium uppercase">{title.title}</span>
        </div>
      )}

      {/* Persistent bottom gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Diagonal shine sweep on hover */}
      <div className="shine-effect absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent w-1/2 pointer-events-none" />

      {/* Emerald top accent line — slides in on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-10" />

      {/* Type badge — top right */}
      {title.title_type && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-zinc-950/80 backdrop-blur-sm px-1.5 py-0.5 border border-emerald-400/30">
            {TYPE_BADGE[title.title_type] || title.title_type}
          </span>
        </div>
      )}

      {/* Title info pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 translate-y-0.5 group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-[11px] font-bold leading-snug line-clamp-2 uppercase tracking-wide drop-shadow-lg">
          {title.title}
        </p>
        {title.release_year && (
          <p className="text-zinc-400 text-[9px] mt-0.5 tracking-[0.2em] uppercase font-medium">
            {title.release_year}
          </p>
        )}
      </div>
    </Link>
  )
}
