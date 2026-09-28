export default function StudyLoading() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="study-skeleton h-7 w-40 rounded" />
      <div className="study-skeleton h-4 w-72 max-w-full rounded" />
      <div className="space-y-3 pt-3">
        <div className="study-skeleton study-skeleton-card h-16 rounded-xl" />
        <div className="study-skeleton study-skeleton-card h-16 rounded-xl" />
        <div className="study-skeleton study-skeleton-card h-16 rounded-xl" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
