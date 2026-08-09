export default function Loading() {
  return (
    <main
      className="min-h-dvh bg-cream px-4 py-10"
      aria-busy="true"
      aria-label="Loading TraceTutor"
    >
      <div className="mx-auto max-w-5xl animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-32 rounded-full bg-violet/15" />
        <div className="mt-5 h-14 max-w-xl rounded-2xl bg-ink/8" />
        <div className="mt-4 h-5 max-w-2xl rounded-full bg-ink/6" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="h-72 rounded-[1.75rem] bg-white" />
          <div className="h-72 rounded-[1.75rem] bg-violet-soft" />
        </div>
      </div>
    </main>
  );
}
