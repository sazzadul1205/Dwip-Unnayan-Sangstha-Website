// pages/auth/Steps/ReviewPage.jsx
import { useState, useEffect } from 'react';
import {
  FaEdit, FaUser, FaFileAlt,
  FaLinkedin, FaGithub, FaTwitter, FaFacebook, FaYoutube, FaMedium,
  FaDev, FaStackOverflow, FaGlobe, FaLink, FaFilePdf, FaFileWord,
  FaStar, FaCheckCircle,
} from 'react-icons/fa';
import { MdWork, MdSchool } from 'react-icons/md';
import { GiSuitcase, GiAchievement } from 'react-icons/gi';

const ReviewPage = ({ data, onEditStep }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    if (data.photo instanceof File) {
      const url = URL.createObjectURL(data.photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (data.photo_url) setPhotoUrl(data.photo_url);
    else if (data.photo_path) setPhotoUrl(`/storage/${data.photo_path}`);
    else setPhotoUrl(null);
  }, [data.photo, data.photo_path, data.photo_url]);

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  const socialIcons = {
    linkedin: FaLinkedin, github: FaGithub, twitter: FaTwitter, facebook: FaFacebook,
    youtube: FaYoutube, medium: FaMedium, devto: FaDev, stackoverflow: FaStackOverflow, portfolio: FaGlobe,
  };

  const Section = ({ icon: Icon, title, step, count, children }) => (
    <section className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-gray-500 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
          {count !== undefined && (
            <span className="text-xs text-gray-400 shrink-0">· {count}</span>
          )}
        </div>
        <button
          onClick={() => onEditStep(step)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 transition"
        >
          <FaEdit className="h-3 w-3" /> Edit
        </button>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );

  const Field = ({ label, value }) => (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide font-medium text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 truncate">{value || '—'}</p>
    </div>
  );

  // completion
  let total = 0, done = 0;
  const tick = (cond) => { total++; if (cond) done++; };
  tick(!!data.first_name); tick(!!data.last_name); tick(!!data.phone);
  tick(!!data.birth_date); tick(!!data.gender); tick(!!data.address);
  tick(!!data.experience_years); tick(!!data.current_job_title);
  tick(data.cvs?.length > 0); tick(data.job_histories?.length > 0);
  tick(data.education_histories?.length > 0); tick(data.achievements?.length > 0);
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-4">
      {/* Compact header with completion */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <FaUser className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Your Name'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {data.current_job_title || 'Add a job title'}
              {data.experience_years !== '' && data.experience_years !== undefined && ` · ${data.experience_years} yr`}
            </p>
          </div>
        </div>
        <div className="sm:w-48">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Profile</span>
            <span className="font-semibold text-gray-800 tabular-nums">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section icon={FaUser} title="Basic Information" step={0}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" value={data.first_name} />
            <Field label="Last name" value={data.last_name} />
            <Field label="Phone" value={data.phone} />
            <Field label="Birth date" value={fmtDate(data.birth_date)} />
            <Field label="Gender" value={data.gender} />
            <Field label="Blood type" value={data.blood_type} />
            <div className="col-span-2">
              <Field label="Address" value={data.address} />
            </div>
          </div>
        </Section>

        <Section icon={MdWork} title="Professional" step={1}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Experience" value={data.experience_years !== '' ? `${data.experience_years} yr` : '—'} />
            <Field label="Job title" value={data.current_job_title} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide font-medium text-gray-400 mb-1.5">Social</p>
            {data.social_links && Object.keys(data.social_links).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.social_links).map(([id, url]) => {
                  const Icon = socialIcons[id] || FaLink;
                  return (
                    <a
                      key={id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 hover:border-gray-300 transition"
                    >
                      <Icon className="h-3 w-3" />
                      <span className="capitalize">{id}</span>
                    </a>
                  );
                })}
              </div>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>
        </Section>

        <Section icon={FaFileAlt} title="CV / Resume" step={2} count={data.cvs?.length || 0}>
          {!data.cvs?.length ? (
            <p className="text-sm text-gray-400">No CV uploaded</p>
          ) : (
            <ul className="space-y-2">
              {data.cvs.map((cv, i) => (
                <li key={cv.id || i} className="flex items-center gap-2 text-sm">
                  {cv.type === 'application/pdf'
                    ? <FaFilePdf className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    : <FaFileWord className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  <span className="text-gray-800 truncate flex-1">{cv.original_name}</span>
                  {cv.is_primary && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                      <FaStar className="h-2.5 w-2.5" /> Primary
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={GiSuitcase} title="Work Experience" step={3} count={data.job_histories?.length || 0}>
          {!data.job_histories?.length ? (
            <p className="text-sm text-gray-400">No experience added</p>
          ) : (
            <ul className="space-y-3">
              {data.job_histories.map((job, i) => (
                <li key={i} className="border-l-2 border-gray-200 pl-3">
                  <p className="text-sm font-medium text-gray-900">{job.position || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {job.company_name || '—'} · {job.starting_year} – {job.is_current ? 'Present' : (job.ending_year || 'Present')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={MdSchool} title="Education" step={4} count={data.education_histories?.length || 0}>
          {!data.education_histories?.length ? (
            <p className="text-sm text-gray-400">No education added</p>
          ) : (
            <ul className="space-y-3">
              {data.education_histories.map((edu, i) => (
                <li key={i} className="border-l-2 border-gray-200 pl-3">
                  <p className="text-sm font-medium text-gray-900">{edu.degree || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {edu.institution_name || '—'} · {edu.passing_year}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={GiAchievement} title="Achievements" step={5} count={data.achievements?.length || 0}>
          {!data.achievements?.length ? (
            <p className="text-sm text-gray-400">No achievements added</p>
          ) : (
            <ul className="space-y-3">
              {data.achievements.map((a, i) => (
                <li key={i} className="border-l-2 border-amber-200 pl-3">
                  <p className="text-sm font-medium text-gray-900">{a.achievement_name || '—'}</p>
                  {a.achievement_details && (
                    <p className="text-xs text-gray-500 line-clamp-2">{a.achievement_details}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Single compact status line */}
      <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
        <FaCheckCircle className="h-3.5 w-3.5 text-green-500" />
        <span>Your data is encrypted. You can still edit your profile after submission.</span>
      </div>
    </div>
  );
};

export default ReviewPage;