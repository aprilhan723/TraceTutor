import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Plain-language privacy boundaries for TraceTutor Demo Mode and the public account beta.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Privacy"
      title="Demo Mode stays local. Account Mode is deliberately limited."
      summary="TraceTutor can be evaluated without an account. The optional public account beta stores only the identity, workspace, assignment, response, and learning records needed to connect a tutor with invited students."
      sections={[
        {
          title: "Demo Mode",
          body: "Onboarding choices, mission drafts, attempts, evidence selections, diagnoses, tutor actions, notes, content drafts, demo clock changes, and offline event status stay in browser storage on this device. They are not sent to a TraceTutor database.",
        },
        {
          title: "Account beta",
          body: "Supabase processes account email and password authentication. TraceTutor stores the profile role and display name, tutor workspace and invitation links, assignments, student responses, tutor decisions, and supported study progress. Passwords are handled by Supabase Auth and are not available to tutors.",
        },
        {
          title: "Access boundary",
          body: "Database row-level security limits account records to the learner, their explicitly linked tutor, or the owning tutor workspace as appropriate. Account pages are marked private and are excluded from the service-worker cache. Tutors should never upload content they do not own or have permission to use.",
        },
        {
          title: "Services not connected",
          body: "The public beta has no analytics tracker, advertising network, payment provider, service-role key in the browser, or enabled live OpenAI diagnosis. Demo Mode requires no external account or secret.",
        },
        {
          title: "Your control",
          body: "Reset demo data removes the local learning workspace and demo clock. Account users can sign out, but self-service account deletion and password recovery are not yet available. Do not create an account if those beta limitations are unacceptable.",
        },
        {
          title: "No hidden sync",
          body: "Browser-local offline reconciliation means only that queued demo events were processed on this device. It is not remote synchronization. Authenticated account pages require a connection and are not cached for offline study.",
        },
      ]}
    />
  );
}
