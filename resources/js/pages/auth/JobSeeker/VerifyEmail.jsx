// pages/auth/verify-email.jsx
// -----------------------------------------------------------------------------
// Email Verification page for Dwip Unoyon Songstha.
//
// Behaviour:
//   - Polls /api/user/verification-status every 5s; if the user verifies in
//     another tab/device, we auto-redirect to the profile-complete step.
//   - Lets the user resend the verification email (with a 60s cooldown to
//     prevent accidental spam and to give clear feedback).
//   - Lets the user log out if they signed up with the wrong address.
//
// Layout:
//   - LEFT  : Main action card (steps, status, resend, logout)
//   - RIGHT : "Why verify" reasons + "Didn't receive it?" help (desktop only;
//             on mobile the help block is rendered below the card)
//
// Props (from Inertia shared data / server):
//   - status : optional flash message, e.g. 'verification-link-sent'
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';

// Icons
import {
  LoaderCircle, Mail, Send, LogOut, CheckCircle, MailCheck, Clock,
  Shield, Bell, Briefcase, Sparkles, Inbox,
} from 'lucide-react';

export default function VerifyEmail({ status }) {
  // ---------------------------------------------------------------------------
  // Form state (Inertia useForm helper) — used for POSTs on this page:
  //   - resend verification email
  //   - log out
  // ---------------------------------------------------------------------------
  const { post, processing, errors } = useForm({});

  // ---------------------------------------------------------------------------
  // UI-only state
  // ---------------------------------------------------------------------------
  const [checking, setChecking] = useState(true);       // true during initial status check
  const [resendStatus, setResendStatus] = useState(null); // 'sent' after a local resend
  const [cooldown, setCooldown] = useState(0);          // seconds left before resend is re-enabled

  // ---------------------------------------------------------------------------
  // Poll verification status every 5 seconds.
  // If the backend says the email is verified, navigate to profile completion.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/user/verification-status', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.verified) {
            // Use router.visit for proper Inertia navigation
            router.visit(route('profile.complete'));
            return;
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setChecking(false);
      }
    };

    // Initial check + repeating interval
    checkVerificationStatus();
    const interval = setInterval(checkVerificationStatus, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Resend cooldown timer — decrements once per second while > 0.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  // Resend the verification email and start a 60s cooldown on success.
  const submit = (e) => {
    e.preventDefault();
    post(route('verification.send'), {
      onSuccess: () => {
        setResendStatus('sent');
        setCooldown(60);
      },
    });
  };

  // Log the user out (e.g. if they registered with the wrong email).
  const handleLogout = () => {
    post(route('logout'));
  };

  // ---------------------------------------------------------------------------
  // Static content
  // ---------------------------------------------------------------------------
  // Visual progress indicator: where the user is in the onboarding flow.
  const steps = [
    { label: 'Verify email', active: true },
    { label: 'Complete profile', active: false },
    { label: 'Start applying', active: false },
  ];

  // Reasons shown in the right-hand info panel.
  const reasons = [
    { icon: Shield, title: 'Account security', text: 'Confirms you own this email address' },
    { icon: Bell, title: 'Job alerts', text: 'Get notified when matching roles appear' },
    { icon: Briefcase, title: 'Application updates', text: 'Receive employer replies and offers' },
  ];

  // Troubleshooting checklist shown in the help card.
  const helpItems = [
    'Check your spam or junk folder',
    'Make sure you entered the correct email address',
    'Click "Resend verification email" above',
    'Add our email to your contacts to avoid filtering',
  ];

  // Whether to show the "sent" success banner (server flash OR local resend).
  const showSent = status === 'verification-link-sent' || resendStatus === 'sent';
  const canResend = !processing && cooldown === 0;

  // ---------------------------------------------------------------------------
  // Loading state — brief branded spinner while we do the first status check.
  // ---------------------------------------------------------------------------
  if (checking) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FDFDFC] p-6 text-[#1b1b18]">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-50/40 via-transparent to-amber-50/30" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#706f6c]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Checking your verification status…
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Browser tab title */}
      <Head title="Verify Email · Dwip Unoyon Songstha" />

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
            {/*                     LEFT — MAIN ACTION CARD                  */}
            {/* ============================================================ */}
            <div className="flex-1 rounded-t-2xl border border-[#19140015] bg-white/90 p-6 pb-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-8 lg:rounded-l-2xl lg:rounded-tr-none lg:rounded-br-none lg:p-10">
              {/* Header — branding + title */}
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                    <Mail className="h-5 w-5 text-white" />
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
                <h2 className="text-xl font-bold leading-tight text-[#1b1b18]">
                  Verify your email
                </h2>
                <p className="mt-1 text-sm text-[#706f6c]">
                  We sent a verification link to your inbox. Click it to activate
                  your account and unlock the portal.
                </p>
              </div>

              {/* Progress steps: verify → complete profile → apply */}
              <div className="mb-6 flex items-center">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium sm:text-[11px] ${step.active
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-[#f4f4f2] text-[#a09f9c]'
                        }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${step.active
                            ? 'bg-orange-500 text-white'
                            : 'bg-[#e3e3e0] text-[#706f6c]'
                          }`}
                      >
                        {i + 1}
                      </span>
                      {step.label}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="mx-1.5 h-px w-3 shrink-0 bg-[#e3e3e0] sm:w-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* ---------------- Status banners ---------------- */}
              {/* Success: verification email sent (server flash or local resend) */}
              {showSent && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50/80 p-3.5 text-sm animate-in slide-in-from-top-2 duration-300">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">
                      Verification email sent!
                    </p>
                    <p className="mt-0.5 text-xs text-green-600">
                      A new verification link is on its way to your inbox.
                    </p>
                  </div>
                </div>
              )}

              {/* Error: e.g. resend throttled by the backend */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3.5 text-sm animate-in slide-in-from-top-2 duration-300">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <p className="text-xs text-red-600">
                    {Object.values(errors)[0]}
                  </p>
                </div>
              )}

              {/* ---------------- "Check your inbox" card ---------------- */}
              <div className="mb-4 overflow-hidden rounded-xl border border-[#e3e3e0] bg-[#FDFDFC]">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <MailCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#1b1b18]">
                      Check your inbox
                    </h3>
                    <p className="mt-0.5 text-xs text-[#706f6c]">
                      We've sent a verification link to your email address
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 border-t border-[#e3e3e0] px-4 py-2.5 text-xs text-[#706f6c]">
                  <Clock className="h-3 w-3" />
                  <span>The link expires in 60 minutes</span>
                </div>
              </div>

              {/* Auto-detect notice */}
              <div className="mb-5 flex items-center justify-center gap-1.5 text-xs text-[#706f6c]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                </span>
                This page automatically detects when your email is verified
              </div>

              {/* ---------------- Action buttons ---------------- */}
              <div className="space-y-2.5">
                {/* Resend verification email (with cooldown) */}
                <form onSubmit={submit}>
                  <button
                    type="submit"
                    disabled={!canResend}
                    className="group relative inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#1b1b18] to-[#2a2a26] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-black/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {processing ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Resend in {cooldown}s
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        Resend verification email
                      </>
                    )}
                  </button>
                </form>

                {/* Log out */}
                <button
                  onClick={handleLogout}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#19140035] bg-white px-5 py-3 text-sm font-medium text-[#1b1b18] transition-all duration-200 hover:border-[#1915014a] hover:bg-[#f8f8f6] active:scale-[0.99]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>

              {/* Trust note */}
              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#a09f9c]">
                <Shield className="h-3 w-3" />
                <span>Your email is only used for account and job updates</span>
              </div>

              {/* ---------------- Mobile-only help block ---------------- */}
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 lg:hidden">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                  <Inbox className="h-4 w-4" />
                  Didn't receive the email?
                </h4>
                <ul className="space-y-1.5">
                  {helpItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-amber-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ============================================================ */}
            {/*         RIGHT — WHY VERIFY + HELP PANEL (desktop only)       */}
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
                  Dwip Unoyon Songstha
                </div>

                {/* Why verify */}
                <h3 className="mb-1 text-base font-bold leading-snug text-[#1b1b18]">
                  Why verify your email?
                </h3>
                <p className="mb-4 text-sm text-[#5c5b56]">
                  Verification keeps your account and job applications safe.
                </p>

                <div className="mb-6 space-y-2">
                  {reasons.map((r) => (
                    <div
                      key={r.title}
                      className="flex items-start gap-3 rounded-lg border border-white/60 bg-white/60 p-2.5 backdrop-blur-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <r.icon className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1b1b18]">{r.title}</p>
                        <p className="text-[11px] leading-snug text-[#706f6c]">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Help card */}
                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-md backdrop-blur-md">
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1b1b18]">
                    <Inbox className="h-4 w-4 text-orange-600" />
                    Didn't receive the email?
                  </h4>
                  <ul className="space-y-1.5">
                    {helpItems.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px] text-[#5c5b56]">
                        <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer note */}
                <p className="mt-auto pt-6 text-[11px] leading-relaxed text-[#706f6c]">
                  Once verified, you'll have full access to all job seeker features —
                  browsing jobs, applying, and tracking your applications.
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