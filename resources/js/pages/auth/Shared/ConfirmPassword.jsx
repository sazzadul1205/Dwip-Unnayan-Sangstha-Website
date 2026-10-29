// pages/auth/confirm-password.jsx
// -----------------------------------------------------------------------------
// Password Confirmation page for Dwip Unoyon Songstha.
//
// Shown before accessing sensitive areas of the app (Laravel's
// `password.confirm` middleware triggers this automatically).
//
// Layout:
//   - LEFT  : Confirm form (single password field + submit)
//   - RIGHT : "Why we're asking" info panel (desktop)
//   - Mobile: security tips rendered below the form
// -----------------------------------------------------------------------------

// React
import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

// Icons
import {
    FaSpinner, FaEye, FaEyeSlash, FaLock, FaShieldAlt, FaArrowRight,
    FaCheckCircle, FaArrowLeft, FaUserShield, FaHistory, FaKey,
} from 'react-icons/fa';

export default function ConfirmPassword() {
    // ---------------------------------------------------------------------------
    // Form state — single password field posted to `password.confirm`.
    // ---------------------------------------------------------------------------
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    // ---------------------------------------------------------------------------
    // UI-only state
    // ---------------------------------------------------------------------------
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // ---------------------------------------------------------------------------
    // Submit — POST to `password.confirm`; clears the field on completion
    // so the plaintext password isn't left in the DOM.
    // ---------------------------------------------------------------------------
    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    // ---------------------------------------------------------------------------
    // Static content for the right-hand info panel
    // ---------------------------------------------------------------------------
    const reasons = [
        { icon: FaUserShield, title: 'Verify your identity', text: 'Confirms it’s really you accessing this page' },
        { icon: FaKey, title: 'Protect sensitive actions', text: 'Bank-level protection for critical changes' },
        { icon: FaHistory, title: 'Quick check', text: 'Usually expires in 15 minutes — no friction' },
    ];

    const securityTips = [
        'Never share your password with anyone',
        'Use a strong, unique password for this account',
        'Enable two-factor authentication for extra security',
    ];

    return (
        <>
            <Head title="Confirm Password · Dwip Unoyon Songstha" />

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
                        {/*                    LEFT — CONFIRM FORM                       */}
                        {/* ============================================================ */}
                        <div className="flex-1 rounded-t-2xl border border-[#19140015] bg-white/90 p-6 pb-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-8 lg:rounded-l-2xl lg:rounded-tr-none lg:rounded-br-none lg:p-10">
                            {/* Back link to landing page */}
                            <a
                                href="/"
                                className="group mb-6 inline-flex items-center gap-1.5 text-xs text-[#706f6c] transition-colors hover:text-[#1b1b18]"
                            >
                                <FaArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                                Back to home
                            </a>

                            {/* Header — brand + page title */}
                            <div className="mb-6">
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                                        <FaShieldAlt className="h-5 w-5 text-white" />
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
                                    Confirm your password
                                </h2>
                                <p className="mt-1 text-sm text-[#706f6c]">
                                    This is a secure area. Please confirm your password before
                                    continuing.
                                </p>
                            </div>

                            {/* Amber security notice */}
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5">
                                <FaShieldAlt className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                <p className="text-xs leading-relaxed text-amber-800">
                                    For your security, we need to verify your identity before
                                    accessing sensitive areas.
                                </p>
                            </div>

                            {/* -------------------- CONFIRM FORM -------------------- */}
                            <form className="flex flex-col gap-4" onSubmit={submit}>
                                {/* Password field */}
                                <div className="grid gap-1.5">
                                    <label htmlFor="password" className="text-sm font-medium text-[#1b1b18]">
                                        Password
                                    </label>
                                    <div
                                        className={`relative rounded-lg transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-orange-500/30 ring-offset-1' : ''
                                            }`}
                                    >
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoFocus
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Enter your password"
                                            className="peer w-full rounded-lg border border-[#19140035] bg-white py-3 pl-10 pr-10 text-sm transition-all duration-200 placeholder:text-[#a09f9c] focus:border-orange-400 focus:outline-none"
                                        />
                                        <FaLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#706f6c] transition-colors peer-focus:text-orange-600" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#706f6c] transition-colors hover:text-[#1b1b18]"
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-red-500 animate-in slide-in-from-top-1 duration-200">
                                            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Primary submit — brand gradient */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#1b1b18] to-[#2a2a26] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-black/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {processing ? (
                                        <>
                                            <FaSpinner className="h-4 w-4 animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            Confirm password
                                            <FaArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>

                                {/* Forgot-password link */}
                                <p className="text-center text-sm text-[#706f6c]">
                                    Forgot it?{' '}
                                    <a
                                        href={route('password.request')}
                                        className="font-medium text-[#1b1b18] underline-offset-4 transition-colors hover:text-orange-600 hover:underline"
                                    >
                                        Reset your password
                                    </a>
                                </p>
                            </form>

                            {/* Trust note */}
                            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#a09f9c]">
                                <FaShieldAlt className="h-3 w-3" />
                                <span>Your password is never stored in this page</span>
                            </div>

                            {/* Mobile-only security tips */}
                            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 lg:hidden">
                                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                                    <FaShieldAlt className="h-4 w-4" />
                                    Security tips
                                </p>
                                <ul className="space-y-1.5">
                                    {securityTips.map((tip) => (
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
                        {/*           RIGHT — WHY WE'RE ASKING PANEL (desktop)           */}
                        {/* ============================================================ */}
                        <div className="relative hidden w-95 shrink-0 overflow-hidden rounded-r-2xl lg:block">
                            <div className="absolute inset-0 bg-linear-to-br from-orange-100 via-amber-50 to-orange-50" />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_60%)]" />
                            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

                            <div className="relative flex h-full flex-col p-8">
                                {/* Pill badge */}
                                <div className="mb-5 inline-flex items-center gap-1.5 self-start rounded-full border border-white/60 bg-white/60 px-2.5 py-1 text-xs font-medium text-[#1b1b18] backdrop-blur-sm">
                                    <FaShieldAlt className="h-3 w-3 text-orange-600" />
                                    Secure area
                                </div>

                                <h3 className="mb-1 text-base font-bold leading-snug text-[#1b1b18]">
                                    Why we're asking
                                </h3>
                                <p className="mb-4 text-sm text-[#5c5b56]">
                                    A quick check to keep your account safe.
                                </p>

                                {/* Reasons */}
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

                                {/* Security tips */}
                                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-md backdrop-blur-md">
                                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1b1b18]">
                                        <FaCheckCircle className="h-4 w-4 text-green-500" />
                                        Security tips
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {securityTips.map((tip) => (
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