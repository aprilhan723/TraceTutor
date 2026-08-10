import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream p-5">
      <Card className="w-full max-w-xl text-center sm:p-10">
        <div className="flex justify-center">
          <BrandMark href="/" />
        </div>
        <p className="mt-8 text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Offline fallback
        </p>
        <h1 className="mt-4 font-editorial text-4xl">
          Your saved correction is still on this device.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Reopen Today or an already-downloaded mission. New pages need a
          connection. Attempts made offline remain local and reconcile in this
          demo when you reconnect—there is no multi-device sync yet.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/student/today">Open saved Today</Button>
          <Button href="/" variant="secondary">
            Product home
          </Button>
        </div>
        <p className="mt-7 text-xs leading-5 text-ink-muted">
          Independent practice software. Not endorsed by ETS. No official TOEFL
          score is provided.
        </p>
      </Card>
    </main>
  );
}
