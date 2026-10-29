// pages/auth/forgot-password.jsx
// -----------------------------------------------------------------------------
// Forgot Password page for Dwip Unoyon Songstha.
//
// Shown when a user clicks "Forgot password?" on login. Submits their email
// to `password.email`; the server sends a signed reset link.
//
// Layout:
//   - LEFT  : Email form
//   - RIGHT : "What happens next" + tips (desktop)
//   - Mobile: tips rendered below the form
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    LoaderCircle, Mail, ArrowLeft, Send, Key, MailCheck,
    Shield, Clock, Inbox, Sparkles,
} from 'lucide-react';

export default function ForgotPassword({ status }) {
    // ---------------------------------------------------------------------------
    // Form state — single email field posted to `password.email`.
    // ---------------------------------------------------------------------------
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const [focusedField, setFocusedField] = useState(null);

    // Submit the email to the reset route. Server handles rate limiting.
    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    // ---------------------------------------------------------------------------
    // Static content
    // ---------------------------------------------------------------------------
    const steps = [
        { icon: Inbox, title: 'Check your inbox', text: 'We’ll email you a secure reset link' },
        { icon: Clock, title: 'Link expires in 60 min', text: 'Resets are time-limited for safety' },
        { icon: Shield, title: 'Choose a new password', text: 'Pick something strong and unique' },
    ];

    const tips = [
        'Check your spam or junk folder if you don’t see the email',
        'The reset link expires in 60 minutes',
        'Make sure to use the email address you registered with',
    ];

    return (
        <>
            <Head title="Forgot Password · Dwip Unoyon Songstha" />

            {/* ---------------- Page wrapper ---------------- */}
            <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#FDFDFC] p-4 text-[#1b1b18] sm:p-6 lg:justify-center lg:p-8">
                {/* Decorative background */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-50/40 via-transparent to-amber-50/30" />
                <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-100/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-50/20 blur-3xl" />

                <div className="relative z-10 flex w-full items-center justify-center">
                    <main className="flex w-full max-w-md flex-col items-stretch lg:max-w-4xl lg:flex-row">
                        {/* ============================================================ */}
                        {/*                    LEFT — EMAIL FORM                         */}
                        {/* ============================================================ */}
                        <div className="flex-1 rounded-t-2xl border border-[#19140015] bg-white/90 p-6 pb-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-8 lg:rounded-l-2xl lg:rounded-tr-none lg:rounded-br-none lg:p-10">
                            {/* Back link */}
                            <a
                                href={route('login')}
                                className="group mb-6 inline-flex items-center gap-1.5 text-xs text-[#706f6c] transition-colors hover:text-[#1b1b18]"
                            >
                                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                                Back to log in
                            </a>

                            {/* Header */}
                            <div className="mb-6">
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                                        <Key className="h-5 w-5 text-white" />
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
                                    Forgot your password?
                                </h2>
                                <p className="mt-1 text-sm text-[#706f6c]">
                                    No problem. Enter your email and we'll send you a secure reset
                                    link.
                                </p>
                            </div>

                            {/* ---------------- Status banner ---------------- */}
                            {status && (
                                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50/80 p-3.5 text-sm animate-in slide-in-from-top-2 duration-300">
                                    <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-700">Email sent!</p>
                                        <p className="mt-0.5 text-xs text-green-600">{status}</p>
                                    </div>
                                </div>
                            )}

                            {/* ---------------- FORM ---------------- */}
                            <form className="flex flex-col gap-4" onSubmit={submit}>
                                <div className="grid gap-1.5">
                                    <label htmlFor="email" className="text-sm font-medium text-[#1b1b18]">
                                        Email address
                                    </label>
                                    <div
                                        className={`relative rounded-lg transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-orange-500/30 ring-offset-1' : ''
                                            }`}
                                    >
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            autoComplete="off"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="email@example.com"
                                            className="peer w-full rounded-lg border border-[#19140035] bg-white py-3 pl-10 pr-3 text-sm transition-all duration-200 placeholder:text-[#a09f9c] focus:border-orange-400 focus:outline-none"
                                        />
                                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#706f6c] transition-colors peer-focus:text-orange-600" />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-red-500 animate-in slide-in-from-top-1 duration-200">
                                            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#1b1b18] to-[#2a2a26] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-black/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Trust note */}
                            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#a09f9c]">
                                <Shield className="h-3 w-3" />
                                <span>We'll only send reset emails to registered addresses</span>
                            </div>

                            {/* Mobile-only tips */}
                            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 lg:hidden">
                                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                                    <Sparkles className="h-4 w-4" />
                                    Helpful tips
                                </p>
                                <ul className="space-y-1.5">
                                    {tips.map((tip) => (
                                        <li
                                            key={tip}
                                            className="flex items-start gap-2 text-xs text-amber-700"
                                        >
                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/*           RIGHT — WHAT HAPPENS NEXT PANEL (desktop)          */}
                        {/* ============================================================ */}
                        <div className="relative hidden w-95 shrink-0 overflow-hidden rounded-r-2xl lg:block">
                            <div className="absolute inset-0 bg-linear-to-br from-orange-100 via-amber-50 to-orange-50" />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_60%)]" />
                            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

                            <div className="relative flex h-full flex-col p-8">
                                <div className="mb-5 inline-flex items-center gap-1.5 self-start rounded-full border border-white/60 bg-white/60 px-2.5 py-1 text-xs font-medium text-[#1b1b18] backdrop-blur-sm">
                                    <Sparkles className="h-3 w-3 text-orange-600" />
                                    Password reset
                                </div>

                                <h3 className="mb-1 text-base font-bold leading-snug text-[#1b1b18]">
                                    What happens next?
                                </h3>
                                <p className="mb-4 text-sm text-[#5c5b56]">
                                    A simple, three-step recovery flow.
                                </p>

                                <div className="mb-6 space-y-2">
                                    {steps.map((s, i) => (
                                        <div
                                            key={s.title}
                                            className="flex items-start gap-3 rounded-lg border border-white/60 bg-white/60 p-2.5 backdrop-blur-sm"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                                                <s.icon className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-[#1b1b18]">
                                                    {i + 1}. {s.title}
                                                </p>
                                                <p className="text-[11px] leading-snug text-[#706f6c]">
                                                    {s.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-md backdrop-blur-md">
                                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1b1b18]">
                                        <Sparkles className="h-4 w-4 text-orange-600" />
                                        Tips
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {tips.map((tip) => (
                                            <li key={tip} className="flex items-start gap-2 text-[11px] text-[#5c5b56]">
                                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="pointer-events-none absolute inset-0 rounded-r-2xl shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.08)]" />
                        </div>
                    </main>
                </div>

                <div className="hidden h-14.5 lg:block" />
            </div>
        </>
    );
}