// resources/js/pages/Backend/CMS/Shared/Components/EditorSection.jsx
const TONES = {
  blue: { panel: 'from-blue-50 to-indigo-50 border-blue-100/80', icon: 'bg-blue-100 text-blue-600' },
  emerald: { panel: 'from-emerald-50 to-teal-50 border-emerald-100/80', icon: 'bg-emerald-100 text-emerald-600' },
  orange: { panel: 'from-orange-50 to-amber-50 border-orange-100/80', icon: 'bg-orange-100 text-orange-600' },
  violet: { panel: 'from-violet-50 to-fuchsia-50 border-violet-100/80', icon: 'bg-violet-100 text-violet-600' },
  cyan: { panel: 'from-cyan-50 to-sky-50 border-cyan-100/80', icon: 'bg-cyan-100 text-cyan-600' },
  slate: { panel: 'from-slate-50 to-gray-50 border-slate-200/80', icon: 'bg-slate-100 text-slate-600' },
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
  const t = TONES[tone] ?? TONES.blue;
  return (
    <section className={`rounded-2xl border bg-linear-to-br ${t.panel} p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex items-start gap-3">
        {Icon && (
          <div className={`shrink-0 rounded-xl p-2.5 ${t.icon}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}