export default function StudyLoading() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded bg-stone-800" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-stone-800" />
      <div className="space-y-3 pt-3">
        <div className="h-16 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
        <div className="h-16 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
        <div className="h-16 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
