export default function Logo({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_0_32px_rgba(34,211,238,0.22)] overflow-hidden">
        <img
          src="/brand/chris-tech-logo.png"
          alt="Chris Tech"
          className="h-9 w-9 object-contain"
        />
      </div>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-semibold tracking-tight text-white">Chris Tech</span>
          <span className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Synthetic Markets</span>
        </div>
      )}
    </div>
  );
}
