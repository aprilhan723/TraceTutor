"use client";

import { useStudentDemo } from "@/components/student/student-demo-provider";

export function ConnectivityNotice() {
  const { hydrated, isOffline, queuedOfflineCount } = useStudentDemo();
  if (!hydrated || (!isOffline && queuedOfflineCount === 0)) return null;
  return (
    <div
      className={
        isOffline ? "bg-violet-deep text-white" : "bg-mint text-mint-deep"
      }
      role="status"
    >
      <p className="mx-auto max-w-5xl px-4 py-2 text-center text-xs leading-5 font-bold sm:px-6">
        {isOffline
          ? `Offline · saved work stays on this device${queuedOfflineCount ? ` · ${queuedOfflineCount} attempt ${queuedOfflineCount === 1 ? "event" : "events"} queued` : ""}`
          : "Connection restored · queued local attempt events reconciled"}
      </p>
    </div>
  );
}
