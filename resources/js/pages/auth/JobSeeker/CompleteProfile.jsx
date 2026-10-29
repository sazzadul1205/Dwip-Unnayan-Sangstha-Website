// pages/auth/completeProfile.jsx
// -----------------------------------------------------------------------------
// Multi-step "Complete Your Profile" wizard for Dwip Unoyon Songstha.
//
// Flow:
//   Step 1. Basic info          (required: first name, last name, phone)
//   Step 2. Professional info   (optional)
//   Step 3. CV upload           (required: at least one CV)
//   Step 4. Work experience     (optional — validated if any field is filled)
//   Step 5. Education           (optional — validated if any field is filled)
//   Step 6. Achievements        (optional — validated if any field is filled)
//   Step 7. Review & Submit     (final step, no Next button)
//
// State / persistence:
//   • Data lives in Inertia's `useForm` (single source of truth).
//   • On every change, we mirror it into `localStorage.profile_form_data`
//     so users can close the tab and resume later.
//   • `photo` (File) is *never* saved to localStorage — File objects aren't
//     serializable, and photo files are uploaded separately via `handlePhotoUpload`.
//   • The wizard re-hydrates from localStorage on mount, then (if a server
//     `applicantProfile` prop is present) overwrites with server state.
//
// Important implementation notes:
//   • `handleSetData` wraps `setData` so that children always get a
//     localStorage write after every keystroke — the setTimeout defers the
//     write until React has committed the new `data` value.
//   • Step components are unchanged and receive the same props
//     (`data`, `setData={handleSetData}`, `errors`).
//   • The Review step is rendered separately and gets `onEditStep` so the
//     user can jump back to any completed step.
// -----------------------------------------------------------------------------

import { useEffect, useState, useCallback } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaRedoAlt, FaSpinner,
  FaUser, FaFileAlt, FaBriefcase, FaGraduationCap, FaTrophy, FaEye,
  FaShieldAlt,
} from 'react-icons/fa';
import { MdWork } from 'react-icons/md';

// Step components — DO NOT modify imports; these own their own UI.
import CVUpload from './Steps/CVUpload';
import Education from './Steps/Education';
import BasicInfo from './Steps/BasicInfo';
import ReviewPage from './Steps/ReviewPage';
import Achievements from './Steps/Achievements';
import WorkExperience from './Steps/WorkExperience';
import ProfessionalInfo from './Steps/ProfessionalInfo';

const CompleteProfile = ({ applicantProfile = null }) => {
  // ---------------------------------------------------------------------------
  // Wizard state
  //   - currentStep    : index into `steps` (0..6)
  //   - completedSteps : Set of step indices that pass their validator
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // ---------------------------------------------------------------------------
  // Form state — mirrors the final submission payload.
  //   NOTE: `photo` is a File (never persisted to localStorage).
  //   `photo_path` / `photo_url` come from the server after upload.
  // ---------------------------------------------------------------------------
  const { data, setData, post, processing, errors } = useForm({
    first_name: '', last_name: '', birth_date: '', gender: '', blood_type: '', phone: '', address: '',
    photo: null, photo_path: null, photo_url: null,
    experience_years: '', current_job_title: '', social_links: {},
    cvs: [], job_histories: [], education_histories: [], achievements: [],
  });

  // ---------------------------------------------------------------------------
  // Step registry — icon + component for each step (order matters).
  // The final entry (Review) is rendered specially in the layout.
  // ---------------------------------------------------------------------------
  const steps = [
    { name: 'Basic', component: BasicInfo, icon: FaUser },
    { name: 'Professional', component: ProfessionalInfo, icon: MdWork },
    { name: 'CV', component: CVUpload, icon: FaFileAlt },
    { name: 'Experience', component: WorkExperience, icon: FaBriefcase },
    { name: 'Education', component: Education, icon: FaGraduationCap },
    { name: 'Achievements', component: Achievements, icon: FaTrophy },
    { name: 'Review', component: ReviewPage, icon: FaEye },
  ];

  // ---------------------------------------------------------------------------
  // LocalStorage helpers
  //   - `photo` (File) is stripped before saving
  //   - any JSON error is logged but never throws to the UI
  // ---------------------------------------------------------------------------
  const saveToLocalStorage = useCallback((d) => {
    try {
      const s = { ...d };
      if (s.photo instanceof File) s.photo = null;
      localStorage.setItem('profile_form_data', JSON.stringify(s));
    } catch (e) {
      console.error('Error :', e);
    }
  }, []);

  // Re-hydrate from localStorage on mount.
  // Note: `photo` is intentionally skipped (File can't be revived from JSON);
  // `cvs` and `photo_path` are restored because they're serializable.
  useEffect(() => {
    const saved = localStorage.getItem('profile_form_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([k, v]) => {
          if (k !== 'photo' && k !== 'cvs') setData(k, v);
          else if (k === 'cvs') setData('cvs', v);
          else if (k === 'photo_path') setData('photo_path', v);
        });
      } catch (e) {
        console.error('Error :', e);
      }
    }
  }, [setData]);

  // If the server sends a saved profile, it wins over localStorage.
  // We also refresh the localStorage snapshot so the two stay in sync.
  useEffect(() => {
    if (applicantProfile?.id) {
      const next = {
        first_name: applicantProfile.first_name || '',
        last_name: applicantProfile.last_name || '',
        birth_date: applicantProfile.birth_date || '',
        gender: applicantProfile.gender || '',
        blood_type: applicantProfile.blood_type || '',
        phone: applicantProfile.phone || '',
        address: applicantProfile.address || '',
        photo: null,
        photo_path: applicantProfile.photo_path || null,
        photo_url: applicantProfile.photo_url || null,
        experience_years: applicantProfile.experience_years || '',
        current_job_title: applicantProfile.current_job_title || '',
        social_links: applicantProfile.social_links || {},
        cvs: applicantProfile.cvs || [],
        job_histories: applicantProfile.job_histories || [],
        education_histories: applicantProfile.education_histories || [],
        achievements: applicantProfile.achievements || [],
      };
      Object.entries(next).forEach(([k, v]) => setData(k, v));
      saveToLocalStorage(next);
    }
  }, [applicantProfile, setData, saveToLocalStorage]);

  // Wrapper passed to step components — updates form state AND schedules a
  // localStorage write. The `setTimeout(…, 0)` waits for `setData` to commit
  // so the snapshot reflects the new value (not the previous `data`).
  const handleSetData = useCallback((key, value) => {
    setData(key, value);
    setTimeout(() => saveToLocalStorage({ ...data, [key]: value }), 0);
  }, [data, setData, saveToLocalStorage]);

  // ---------------------------------------------------------------------------
  // Step validators — each returns an array of human-readable error strings.
  // An empty array means the step is valid.
  // ---------------------------------------------------------------------------
  const validateBasicInfo = useCallback(() => {
    const errs = [];
    if (!data.first_name?.trim()) errs.push('First name is required');
    if (!data.last_name?.trim()) errs.push('Last name is required');
    if (!data.phone?.trim() || data.phone === '+880') errs.push('Phone number is required');
    return errs;
  }, [data.first_name, data.last_name, data.phone]);

  const validateCVUpload = useCallback(
    () => (data.cvs?.length ? [] : ['Please upload at least one CV']),
    [data.cvs]
  );

  const validateWorkExperience = useCallback(() => {
    const errs = [];
    data.job_histories?.forEach((j, i) => {
      const hasAny = j.company_name?.trim() || j.position?.trim();
      if (hasAny && !j.company_name?.trim()) errs.push(`Experience #${i + 1}: Company name is required`);
      if (hasAny && !j.position?.trim()) errs.push(`Experience #${i + 1}: Position is required`);
    });
    return errs;
  }, [data.job_histories]);

  const validateEducation = useCallback(() => {
    const errs = [];
    data.education_histories?.forEach((e, i) => {
      const hasAny = e.institution_name?.trim() || e.degree?.trim();
      if (hasAny && !e.institution_name?.trim()) errs.push(`Education #${i + 1}: Institution is required`);
      if (hasAny && !e.degree?.trim()) errs.push(`Education #${i + 1}: Degree is required`);
    });
    return errs;
  }, [data.education_histories]);

  const validateAchievements = useCallback(() => {
    const errs = [];
    data.achievements?.forEach((a, i) => {
      const hasAny = a.achievement_name?.trim() || a.achievement_details?.trim();
      if (hasAny && !a.achievement_name?.trim()) errs.push(`Achievement #${i + 1}: Title is required`);
    });
    return errs;
  }, [data.achievements]);

  // Dispatch to the correct validator by step index.
  const validateStep = useCallback((i) => {
    switch (i) {
      case 0: return validateBasicInfo();
      case 1: return [];                      // Professional: always optional
      case 2: return validateCVUpload();
      case 3: return validateWorkExperience();
      case 4: return validateEducation();
      case 5: return validateAchievements();
      default: return [];                     // Review: no validation
    }
  }, [validateBasicInfo, validateCVUpload, validateWorkExperience, validateEducation, validateAchievements]);

  // Convenience: does a given step currently pass its validator?
  const isStepCompleted = useCallback((i) => validateStep(i).length === 0, [validateStep]);

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------
  // Next: validate current step → mark complete → advance + persist + scroll.
  const handleNext = useCallback(() => {
    const errs = validateStep(currentStep);
    if (errs.length) {
      // SweetAlert2 with brand-themed confirm color.
      Swal.fire({
        icon: 'warning',
        title: 'Please complete this step',
        html: `<ul class="text-left text-sm text-red-600 space-y-1">${errs.map((e) => `<li>• ${e}</li>`).join('')}</ul>`,
        confirmButtonColor: '#ea580c',
      });
      return;
    }
    setCompletedSteps((p) => new Set([...p, currentStep]));
    if (currentStep < steps.length - 1) {
      saveToLocalStorage(data);
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, data, steps.length, validateStep, saveToLocalStorage]);

  // Back: persist current data before moving back.
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      saveToLocalStorage(data);
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, data, saveToLocalStorage]);

  // Jump to a step from the rail — only allowed for completed/current steps.
  const handleEditStep = useCallback((i) => {
    if (i < 0 || i >= steps.length) return;
    if (i === currentStep || completedSteps.has(i) || i < currentStep) {
      saveToLocalStorage(data);
      setCurrentStep(i);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, completedSteps, steps.length, data, saveToLocalStorage]);

  // ---------------------------------------------------------------------------
  // Photo upload (separate endpoint, returns the stored path)
  // ---------------------------------------------------------------------------
  const handlePhotoUpload = useCallback(async (file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const r = await fetch('/profile/photo', {
        method: 'POST',
        body: fd,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!r.ok) throw new Error('Photo upload failed');
      const res = await r.json();
      return res.photo_path;
    } catch {
      Swal.fire({ icon: 'error', title: 'Photo upload failed', text: 'Please try again.' });
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Final submit
  //   1. Confirm with the user.
  //   2. Sanity-check required fields.
  //   3. Upload the photo if it's still a File.
  //   4. POST the trimmed payload to /profile/complete.
  //   5. Clear localStorage and redirect to the dashboard.
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(() => {
    Swal.fire({
      title: 'Submit profile?',
      html: '<p class="text-sm text-gray-600">You can still edit your profile later from the dashboard.</p>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981', // success green — kept semantic
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;

      if (!data.first_name || !data.last_name || !data.phone) {
        Swal.fire({
          icon: 'error',
          title: 'Missing info',
          text: 'First name, last name and phone are required.',
        });
        return;
      }

      // Upload the photo if the user picked one during this session.
      let photoPath = data.photo_path;
      if (data.photo instanceof File) {
        const p = await handlePhotoUpload(data.photo);
        if (p) photoPath = p;
      }

      // Only send what the backend needs for CVs (skip preview URLs etc.).
      const submitData = {
        ...data,
        photo_path: photoPath,
        cvs: data.cvs.map((cv) => ({
          id: cv.id,
          is_primary: cv.is_primary,
          order_position: cv.order_position,
        })),
      };
      delete submitData.photo; // File is not JSON-serializable

      post('/profile/complete', {
        data: submitData,
        onSuccess: () => {
          localStorage.removeItem('profile_form_data');
          Swal.fire({
            icon: 'success',
            title: 'Profile submitted!',
            text: 'Redirecting…',
            timer: 1800,
            showConfirmButton: false,
          }).then(() => router.visit('/dashboard'));
        },
        onError: (errs) =>
          Swal.fire({
            icon: 'error',
            title: 'Submission failed',
            text: Object.values(errs).flat().join('\n'),
          }),
      });
    });
  }, [data, handlePhotoUpload, post]);

  // ---------------------------------------------------------------------------
  // Derived flags
  // ---------------------------------------------------------------------------
  const isReviewPage = currentStep === steps.length - 1;
  // Progress bar: 0..5 steps map to 16%..100% (review hides the bar).
  const progress = ((currentStep + 1) / (steps.length - 1)) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  // Auto-mark step as complete whenever its validator passes.
  useEffect(() => {
    if (!isReviewPage && isStepCompleted(currentStep)) {
      setCompletedSteps((p) => new Set([...p, currentStep]));
    }
  }, [data, currentStep, isReviewPage, isStepCompleted]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18]">
      <Head title="Complete Your Profile · Dwip Unoyon Songstha" />

      {/* ============================================================ */}
      {/*                STATIC HEADER — org branding                  */}
      {/* ============================================================ */}
      <div className="border-b border-[#19140010] bg-white/85 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Org brand + page title */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                <FaUser className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                  Welcome to
                </p>
                <h1 className="truncate text-base font-bold leading-tight text-[#1b1b18] sm:text-lg">
                  Dwip Unoyon Songstha
                </h1>
                <p className="truncate text-xs text-[#706f6c]">
                  Complete your profile to get started
                </p>
              </div>
            </div>

            {/* Step counter (hidden on the review step and on mobile) */}
            {!isReviewPage && (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 sm:inline-flex">
                Step {currentStep + 1} of {steps.length - 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*                STICKY STEP RAIL + PROGRESS                   */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-20 border-b border-[#19140010] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          {!isReviewPage && (
            <>
              {/* Step pills — horizontally scrollable on small screens */}
              <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1">
                {steps.slice(0, -1).map((s, i) => {
                  const Icon = s.icon;
                  const isDone = completedSteps.has(i);
                  const isActive = i === currentStep;
                  const isAccessible = i <= currentStep || completedSteps.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => isAccessible && handleEditStep(i)}
                      disabled={!isAccessible}
                      className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition ${isActive
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                          : isDone
                            ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                            : isAccessible
                              ? 'text-[#706f6c] hover:bg-[#f4f4f2]'
                              : 'cursor-not-allowed text-[#d1d0cc]'
                        }`}
                    >
                      {isDone && !isActive ? (
                        <FaCheck className="h-2.5 w-2.5" />
                      ) : (
                        <Icon className="h-3 w-3" />
                      )}
                      <span className="whitespace-nowrap">{s.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress bar (brand gradient) */}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e3e3e0]">
                <div
                  className="h-full bg-linear-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*                        CONTENT AREA                          */}
      {/* ============================================================ */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Card — hosts the current step OR the review page */}
        <div className="rounded-2xl border border-[#19140015] bg-white p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] sm:p-7">
          {isReviewPage ? (
            <ReviewPage data={data} onEditStep={handleEditStep} />
          ) : (
            <CurrentStepComponent data={data} setData={handleSetData} errors={errors} />
          )}
        </div>

        {/* Nav row — Back/Next or Clear/Submit depending on the step */}
        <div className="mt-4 flex items-center gap-3">
          {!isReviewPage ? (
            <>
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#19140035] bg-white px-4 py-2.5 text-sm font-medium text-[#1b1b18] transition hover:border-[#1915014a] hover:bg-[#f8f8f6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaArrowLeft className="h-3 w-3" /> Back
              </button>
              <div className="flex-1" />
              <button
                onClick={handleNext}
                className="group inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-[#1b1b18] to-[#2a2a26] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.01] hover:shadow-black/20 active:scale-[0.99]"
              >
                Next
                <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </>
          ) : (
            <>
              {/* Clear local draft + reset the wizard */}
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Clear all data?',
                    text: 'All locally saved profile data will be removed.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Clear',
                    confirmButtonColor: '#dc2626', // destructive — kept red
                    cancelButtonText: 'Cancel',
                    cancelButtonColor: '#6b7280',
                    reverseButtons: true,
                  }).then((r) => {
                    if (r.isConfirmed) {
                      localStorage.removeItem('profile_form_data');
                      router.reload();
                    }
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#19140035] bg-white px-4 py-2.5 text-sm font-medium text-[#1b1b18] transition hover:border-[#1915014a] hover:bg-[#f8f8f6]"
              >
                <FaRedoAlt className="h-3 w-3" /> Clear
              </button>
              <div className="flex-1" />

              {/* Final submit (brand gradient) */}
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] hover:shadow-orange-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {processing ? (
                  <>
                    <FaSpinner className="h-3 w-3 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <FaCheck className="h-3 w-3" /> Submit Profile
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Trust / autosave note (only while filling out the form) */}
        {!isReviewPage && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-[#a09f9c]">
            <FaShieldAlt className="h-3 w-3" />
            Your progress is saved locally — you can close this tab and come back later.
          </p>
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;