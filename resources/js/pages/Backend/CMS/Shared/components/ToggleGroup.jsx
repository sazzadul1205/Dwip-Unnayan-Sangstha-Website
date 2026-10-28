import {
  FaCheckCircle, FaTimesCircle, FaStar, FaRegStar, FaSave, FaSpinner,
} from 'react-icons/fa';

const ToggleGroup = ({
  isSubmitting = false,
  submitLabel = 'Save',
  statusValue = true,
  featuredValue = false,
  onStatusToggle,
  onFeaturedToggle,
  showFeatured = true,
}) => (
  <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Status
        </span>
        <button
          type="button"
          onClick={onStatusToggle}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition
            ${statusValue
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'}`}
        >
          {statusValue
            ? <><FaCheckCircle size={11} /> Active</>
            : <><FaTimesCircle size={11} /> Inactive</>}
        </button>
      </div>

      {showFeatured && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Featured
          </span>
          <button
            type="button"
            onClick={onFeaturedToggle}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition
              ${featuredValue
                ? 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'}`}
          >
            {featuredValue
              ? <><FaStar size={11} /> Featured</>
              : <><FaRegStar size={11} /> Not featured</>}
          </button>
        </div>
      )}
    </div>

    <button
      type="submit"
      disabled={isSubmitting}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting
        ? <><FaSpinner className="animate-spin" size={14} /> Saving…</>
        : <><FaSave size={14} /> {submitLabel}</>}
    </button>
  </div>
);

export default ToggleGroup;