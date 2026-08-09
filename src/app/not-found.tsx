import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 py-12">
      <div className="max-w-xl text-center">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <p
          className="mt-12 font-editorial text-8xl leading-none text-violet/20"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="-mt-4 font-editorial text-5xl tracking-tight">
          This trace ends here.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          The page you followed does not exist in this demo.
        </p>
        <Button href="/" className="mt-7">
          Return home
        </Button>
      </div>
    </main>
  );
}
