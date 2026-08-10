export default function TutorLoading() {
  return (
    <div
      className="animate-pulse motion-reduce:animate-none"
      role="status"
      aria-label="Loading tutor workspace"
    >
      <div className="h-4 w-36 rounded-full bg-coral/15" />
      <div className="mt-5 h-14 max-w-2xl rounded-2xl bg-ink/8" />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="h-56 rounded-[2rem] bg-white" />
        <div className="h-56 rounded-[2rem] bg-violet-soft" />
        <div className="h-56 rounded-[2rem] bg-mint" />
      </div>
    </div>
  );
}
