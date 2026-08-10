import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Plain-language privacy boundaries for the local TraceTutor demo.",
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Privacy"
      title="Your demo work stays in this browser."
      summary="Phase 5 is deliberately local. The product can be evaluated without an account, API key, remote database, analytics service, or payment provider."
      sections={[
        {
          title: "What is stored",
          body: "Onboarding choices, mission drafts, attempts, evidence selections, diagnoses, tutor actions, notes, content drafts, demo clock changes, and offline event status are saved in localStorage on this device.",
        },
        {
          title: "What is not sent",
          body: "TraceTutor does not send the demo’s practice data to a TraceTutor server. There is no multi-device sync and clearing browser data may remove progress.",
        },
        {
          title: "Offline cache",
          body: "The service worker caches the app shell, already-visited pages, and static assets. It does not cache credentials or promise that content you have never opened is available offline.",
        },
        {
          title: "Your control",
          body: "Reset demo data removes the local learning workspace and demo clock. Browser settings can remove the service worker cache and site storage completely.",
        },
      ]}
    />
  );
}
