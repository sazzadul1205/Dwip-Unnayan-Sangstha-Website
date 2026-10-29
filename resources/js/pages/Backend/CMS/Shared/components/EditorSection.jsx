// resources/js/pages/Backend/CMS/Shared/Components/EditorSection.jsx

const TONES = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  orange: 'bg-orange-50 text-orange-600 ring-orange-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
  pink: 'bg-pink-50 text-pink-600 ring-pink-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function EditorSection({
  icon: Icon,
  title,
  description,
  tone = 'blue',
  action,
  children,
  className = '',
}) {
  const toneClasses = TONES[tone] ?? TONES.blue;

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className={`shrink-0 rounded-lg p-2 ring-1 ${toneClasses}`}>
              <Icon size={16} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="space-y-4 p-5 sm:p-6">{children}</div>
    </section>
  );
}