// pages/auth/email-verified.jsx
// -----------------------------------------------------------------------------
// Email Verified confirmation page for Dwip Unoyon Songstha.
//
// Behavior:
//   - Celebrates the successful verification.
//   - Auto-redirects to `profile.complete` after a 5-second countdown.
//   - User can:
//       • "Continue now" — skip the countdown
//       • "Stay on this page" — cancel the auto-redirect (accessibility / slow readers)
//
// Layout:
//   - LEFT  : Success card (icon, title, countdown, actions)
//   - RIGHT : "What's next" panel (desktop only)
//   - Mobile: compact "what's next" strip below the card
// -----------------------------------------------------------------------------

// Inertia
import { Head, router } from '@inertiajs/react';

// Icons
import {
  CheckCircle, ArrowRight, Clock, User, Briefcase, Upload,
  Sparkles, Shield, PartyPopper, PauseCircle, ArrowLeft,
} from 'lucide-react';

// React
import { useState, useEffect } from 'react';

export default function EmailVerified() {
  // ---------------------------------------------------------------------------
  // State
  //   - countdown : seconds remaining until auto-redirect (5 → 0)
  //   - paused    : user chose to stay; stops the countdown and hides the redirect
  // ---------------------------------------------------------------------------
  const [countdown, setCountdown] = useState(5);
  const [paused, setPaused] = useState(false);

  // Total duration — kept in a constant so the progress bar and label stay in sync.
  const TOTAL_SECONDS = 5;

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  // Skip the countdown and go straight to profile completion.
  const handleContinue = () => {
    router.get(route('profile.complete'));
  };

  // Cancel the auto-redirect so the user can read at their own pace.
  const handlePause = () => {
    setPaused(true);
  };

  // ---------------------------------------------------------------------------
  // Countdown → auto-redirect
  // Runs once per second while not paused; redirects when it hits 0.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (paused) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.get(route('profile.complete'));
    }
  }, [countdown, paused]);

  // ---------------------------------------------------------------------------
  // Static content
  // ---------------------------------------------------------------------------
  // Where the user is in the onboarding flow — step 1 is now complete.
  const steps = [
    { label: 'Verify email', done: true, active: false, icon: CheckCircle },
    { label: 'Complete profile', done: false, active: true, icon: User },
    { label: 'Start applying', done: false, active: false, icon: Briefcase },
  ];

  // Quick preview of what the next page will ask for.
  const nextSteps = [
    { icon: User, title: 'Personal details', text: 'Name, headline, and contact info' },
    { icon: Upload, title: 'Upload resume', text: 'PDF or Word — takes 30 seconds' },
    { icon: Briefcase, title: 'Career preferences', text: 'Roles, location, and salary range' },
  ];

  // Percentage of countdown remaining (for the progress bar).
  const progress = (countdown / TOTAL_SECONDS) * 100;

  return (
    <>
      {/* Browser tab title */}
      <Head title="Email Verified · Dwip Unoyon Songstha" />

      {/* ---------------- Page wrapper ---------------- */}
      <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#FDFDFC] p-4 text-[#1b1b18] sm:p-6 lg:justify-center lg:p-8">
        {/* Decorative background (purely cosmetic, non-interactive) */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-50/40 via-transparent to-amber-50/30" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-50/20 blur-3xl" />

        <div className="relative z-10 flex w-full items-center justify-center">
          {/* Main two-column container */}
          <main className="flex w-full max-w-md flex-col items-stretch lg:max-w-4xl lg:flex-row">
            {/* ============================================================ */}
            {/*                     LEFT — SUCCESS CARD                       */}
            {/* ============================================================ */}
            <div className="flex-1 rounded-t-2xl border border-[#19140015] bg-white/90 p-6 pb-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-8 lg:rounded-l-2xl lg:rounded-tr-none lg:rounded-br-none lg:p-10">
              {/* Back link to landing page */}
              <a
                href="/"
                className="group mb-6 inline-flex items-center gap-1.5 text-xs text-[#706f6c] transition-colors hover:text-[#1b1b18]"
              >
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                Back to home
              </a>

              {/* Branding strip */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
                    Welcome to
                  </p>
                  <h1 className="text-lg font-bold leading-tight text-[#1b1b18] sm:text-xl">
                    Dwip Unoyon Songstha
                  </h1>
                  <p className="text-xs text-[#706f6c]">Job Seeker Portal</p>
                </div>
              </div>

              {/* ---------------- Success icon ---------------- */}
              <div className="mb-5 flex justify-center">
                <div className="relative">
                  {/* Outer pulsing ring — draws the eye to the success state */}
                  <span className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
                  {/* Static green circle with the check icon */}
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-emerald-500 shadow-xl shadow-green-500/30">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  {/* Confetti-style accent — purely decorative */}
                  <PartyPopper className="absolute -right-3 -top-2 h-5 w-5 rotate-12 text-amber-500" />
                  <Sparkles className="absolute -bottom-2 -left-3 h-4 w-4 -rotate-12 text-orange-500" />
                </div>
              </div>

              {/* ---------------- Headline + subtitle ---------------- */}
              <div className="mb-6 text-center">
                <h2 className="mb-1.5 text-2xl font-bold leading-tight text-[#1b1b18]">
                  Email verified!
                </h2>
                <p className="mx-auto max-w-xs text-sm text-[#706f6c]">
                  Your account is now active. One quick step before you start
                  exploring opportunities.
                </p>
              </div>

              {/* ---------------- Progress steps (verify is done) ---------------- */}
              <div className="mb-6 flex items-center justify-center">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium sm:text-[11px] ${step.done
                          ? 'bg-green-100 text-green-700'
                          : step.active
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-[#f4f4f2] text-[#a09f9c]'
                        }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${step.done
                            ? 'bg-green-500 text-white'
                            : step.active
                              ? 'bg-orange-500 text-white'
                              : 'bg-[#e3e3e0] text-[#706f6c]'
                          }`}
                      >
                        {step.done ? '✓' : i + 1}
                      </span>
                      {step.label}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="mx-1.5 h-px w-3 shrink-0 bg-[#e3e3e0] sm:w-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* ---------------- Countdown / paused state ---------------- */}
              {!paused ? (
                <div className="mb-5 rounded-xl border border-[#e3e3e0] bg-[#FDFDFC] p-3.5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#706f6c]">
                      <Clock className="h-3.5 w-3.5" />
                      Redirecting automatically
                    </span>
                    <span className="font-semibold text-[#1b1b18]">
                      {countdown}s
                    </span>
                  </div>
                  {/* Progress bar drains as countdown ticks */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e3e3e0]">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-500 transition-[width] duration-1000 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePause}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-[#706f6c] transition-colors hover:text-[#1b1b18]"
                  >
                    <PauseCircle className="h-3 w-3" />
                    Stay on this page
                  </button>
                </div>
              ) : (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800">
                  <PauseCircle className="h-4 w-4 shrink-0" />
                  Auto-redirect paused. Continue whenever you're ready.
                </div>
              )}

              {/* ---------------- Primary action ---------------- */}
              <button
                onClick={handleContinue}
                className="group relative inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#1b1b18] to-[#2a2a26] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-black/20 active:scale-[0.99]"
              >
                Continue to Profile Setup
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              {/* Trust note */}
              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#a09f9c]">
                <Shield className="h-3 w-3" />
                <span>Your email is now confirmed and secured</span>
              </div>

              {/* ---------------- Mobile-only "what's next" strip ---------------- */}
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50/70 p-4 lg:hidden">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1b1b18]">
                  <Sparkles className="h-4 w-4 text-orange-600" />
                  What's next?
                </p>
                <ul className="space-y-1.5">
                  {nextSteps.map((n) => (
                    <li
                      key={n.title}
                      className="flex items-center gap-2 text-xs text-[#5c5b56]"
                    >
                      <n.icon className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                      <span>{n.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ============================================================ */}
            {/*              RIGHT — WHAT'S NEXT PANEL (desktop)             */}
            {/* ============================================================ */}
            <div className="relative hidden w-95 shrink-0 overflow-hidden rounded-r-2xl lg:block">
              {/* Layered gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-orange-100 via-amber-50 to-orange-50" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_60%)]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

              <div className="relative flex h-full flex-col p-8">
                {/* Small pill badge with organization name */}
                <div className="mb-5 inline-flex items-center gap-1.5 self-start rounded-full border border-white/60 bg-white/60 px-2.5 py-1 text-xs font-medium text-[#1b1b18] backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-orange-600" />
                  You're almost there
                </div>

                {/* Heading */}
                <h3 className="mb-1 text-base font-bold leading-snug text-[#1b1b18]">
                  What's next?
                </h3>
                <p className="mb-4 text-sm text-[#5c5b56]">
                  Complete your profile to unlock job matching and applications.
                </p>

                {/* Steps list */}
                <div className="space-y-2">
                  {nextSteps.map((n, i) => (
                    <div
                      key={n.title}
                      className="flex items-start gap-3 rounded-lg border border-white/60 bg-white/60 p-2.5 backdrop-blur-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <n.icon className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1b1b18]">
                          {i + 1}. {n.title}
                        </p>
                        <p className="text-[11px] leading-snug text-[#706f6c]">
                          {n.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <p className="mt-auto pt-6 text-[11px] leading-relaxed text-[#706f6c]">
                  Once your profile is complete, matching jobs and employer
                  messages will start arriving in your inbox.
                </p>
              </div>

              {/* Inset hairline border for the panel */}
              <div className="pointer-events-none absolute inset-0 rounded-r-2xl shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.08)]" />
            </div>
          </main>
        </div>

        {/* Spacer to balance vertical centering on large screens */}
        <div className="hidden h-14.5 lg:block" />
      </div>
    </>
  );
}