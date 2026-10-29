// pages/auth/reset-password.jsx
// -----------------------------------------------------------------------------
// Reset Password page for Dwip Unoyon Songstha.
//
// Reached from the emailed reset link. Props:
//   - token : signed reset token from the URL
//   - email : the email the reset was requested for (read-only)
//
// Submits `token`, `email`, `password`, and `password_confirmation` to
// `password.store`.
//
// Layout:
//   - LEFT  : New password form
//   - RIGHT : Password requirements + "why we ask" panel (desktop)
//   - Mobile: requirements list below the form
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    LoaderCircle, Eye, EyeOff, Lock, Mail, Shield, Key, CheckCircle,
    ArrowRight, ArrowLeft, Sparkles,
} from 'lucide-react';

export default function ResetPassword({ token, email }) {
    // ---------------------------------------------------------------------------
    // Form state — includes the token and email from the URL props so the
    // backend can verify the request. `password` fields are cleared on finish.
    // ---------------------------------------------------------------------------
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    // ---------------------------------------------------------------------------
    // UI-only state
    // ---------------------------------------------------------------------------
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // POST to `password.store`; clear both password fields on completion.
    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // ---------------------------------------------------------------------------
    // Static content
    // ---------------------------------------------------------------------------
    const requirements = [
        'At least 8 characters long',
        'Use a mix of letters, numbers, and symbols',
        "Don't use common or easily guessed passwords",
    ];

    // "Do both passwords match?" — used to show a green tick on confirm field.
    const passwordsMatch =
        data.password.length > 0 &&
        data.password === data.password_confirmation;

    return (
        <>
            <Head title="Reset Password · Dwip Unoyon Songstha" />

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
                        {/*                   LEFT — RESET FORM                          */}
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
                                    Reset your password
                                </h2>
                                <p className="mt-1 text-sm text-[#706f6c]">
                                    Choose a new password for your account.
                                </p>
                            </div>

                            {/* -------------------- RESET FORM -------------------- */}
                            <form className="flex flex-col gap-4" onSubmit={submit}>
                                {/* Email (read-only) */}
                                <div className="grid gap-1.5">
                                    <label htmlFor="email" className="text-sm font-medium text-[#1b1b18]">
                                        Email address
                                    </label>
                                    <div className="relative rounded-lg">
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={data.email}
                                            readOnly
                                            className="w-full cursor-not-allowed rounded-lg border border-[#19140035] bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-500"
                                        />
                                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#706f6c]" />
                                    </div>
                                    <p className="text-[11px] text-[#a09f9c]">
                                        This is the address the reset was requested for.
                                    </p>
                                    {errors.email && (
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-red-500">
                                            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* New password */}
                                <div className="grid gap-1.5">
                                    <label htmlFor="password" className="text-sm font-medium text-[#1b1b18]">
                                        New password
                                    </label>
                                    <div
                                        className={`relative rounded-lg transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-orange-500/30 ring-offset-1' : ''
                                            }`}
                                    >
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoFocus
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Enter new password"
                                            className="peer w-full rounded-lg border border-[#19140035] bg-white py-3 pl-10 pr-10 text-sm transition-all duration-200 placeholder:text-[#a09f9c] focus:border-orange-400 focus:outline-none"
                                        />
                                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#706f6c] transition-colors peer-focus:text-orange-600" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#706f6c] transition-colors hover:text-[#1b1b18]"
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-red-500">
                                            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="grid gap-1.5">
                                    <label htmlFor="password_confirmation" className="text-sm font-medium text-[#1b1b18]">
                                        Confirm new password
                                    </label>
                                    <div
                                        className={`relative rounded-lg transition-all duration-200 ${focusedField === 'confirm' ? 'ring-2 ring-orange-500/30 ring-offset-1' : ''
                                            }`}
                                    >
                                        <input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="new-password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            onFocus={() => setFocusedField('confirm')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Re-enter new password"
                                            className="peer w-full rounded-lg border border-[#19140035] bg-white py-3 pl-10 pr-16 text-sm transition-all duration-200 placeholder:text-[#a09f9c] focus:border-orange-400 focus:outline-none"
                                        />
                                        <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#706f6c] transition-colors peer-focus:text-orange-600" />
                                        {/* Match indicator */}
                                        {passwordsMatch && (
                                            <CheckCircle className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#706f6c] transition-colors hover:text-[#1b1b18]"
                                            tabIndex={-1}
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-red-500">
                                            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                                            {errors.password_confirmation}
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#1b1b18] to-[#2a2a26] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-black/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Reset Password
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Trust note */}
                            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#a09f9c]">
                                <Shield className="h-3 w-3" />
                                <span>Choose a strong password to keep your account secure</span>
                            </div>

                            {/* Mobile-only requirements */}
                            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 lg:hidden">
                                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                                    <Lock className="h-4 w-4" />
                                    Password requirements
                                </p>
                                <ul className="space-y-1.5">
                                    {requirements.map((req) => (
                                        <li
                                            key={req}
                                            className="flex items-start gap-2 text-xs text-amber-700"
                                        >
                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/*           RIGHT — REQUIREMENTS + TIPS PANEL (desktop)        */}
                        {/* ============================================================ */}
                        <div className="relative hidden w-95 shrink-0 overflow-hidden rounded-r-2xl lg:block">
                            <div className="absolute inset-0 bg-linear-to-br from-orange-100 via-amber-50 to-orange-50" />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_60%)]" />
                            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

                            <div className="relative flex h-full flex-col p-8">
                                <div className="mb-5 inline-flex items-center gap-1.5 self-start rounded-full border border-white/60 bg-white/60 px-2.5 py-1 text-xs font-medium text-[#1b1b18] backdrop-blur-sm">
                                    <Sparkles className="h-3 w-3 text-orange-600" />
                                    Almost done
                                </div>

                                <h3 className="mb-1 text-base font-bold leading-snug text-[#1b1b18]">
                                    Choose a strong password
                                </h3>
                                <p className="mb-4 text-sm text-[#5c5b56]">
                                    A unique password keeps your account and applications safe.
                                </p>

                                {/* Requirements checklist */}
                                <div className="mb-6 space-y-2">
                                    {requirements.map((req) => (
                                        <div
                                            key={req}
                                            className="flex items-start gap-3 rounded-lg border border-white/60 bg-white/60 p-2.5 backdrop-blur-sm"
                                        >
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                                                <CheckCircle className="h-3.5 w-3.5 text-orange-600" />
                                            </div>
                                            <p className="text-[11px] leading-snug text-[#5c5b56]">{req}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Extra hint */}
                                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-md backdrop-blur-md">
                                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1b1b18]">
                                        <Shield className="h-4 w-4 text-green-500" />
                                        Quick tip
                                    </h4>
                                    <p className="text-[11px] leading-relaxed text-[#5c5b56]">
                                        A good trick is to string together 3–4 unrelated words with a
                                        number and symbol — long, memorable, and hard to guess.
                                    </p>
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