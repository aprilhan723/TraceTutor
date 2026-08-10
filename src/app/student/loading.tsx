export default function StudentLoading() {
  return (
    <div
      className="animate-pulse motion-reduce:animate-none"
      role="status"
      aria-label="Loading student workspace"
    >
      <div className="h-4 w-40 rounded-full bg-violet/15" />
      <div className="mt-5 h-14 max-w-2xl rounded-2xl bg-ink/8" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-[2rem] bg-white" />
        <div className="h-64 rounded-[2rem] bg-violet-soft" />
      </div>
    </div>
  );
}
