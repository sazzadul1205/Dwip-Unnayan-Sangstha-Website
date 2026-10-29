// resources/js/pages/Backend/CMS/Shared/Modals/FaqEditor.jsx
import { FaPlus, FaTrash, FaRegQuestionCircle, FaInfoCircle, FaLightbulb } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'block text-sm font-medium text-slate-700';
const hintClass = 'mt-1.5 flex items-center gap-1.5 text-xs text-slate-400';

export default function FaqEditor({ formData, updateFormData, removeArrayItem, isLoading = false }) {
  const isDisabled = isLoading;
  const totalFaqs = (formData.faqs || []).length;

  const handleRemoveFaq = (index, faq) => {
    Swal.fire({
      title: 'Remove FAQ?',
      html: `Remove "<strong>${faq.question || 'this FAQ'}</strong>" from the list?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) removeArrayItem('faqs', index);
    });
  };

  const handleAddFaq = () => {
    const newFaq = { id: Date.now(), question: '', answer: '' };
    updateFormData('faqs', [newFaq, ...(formData.faqs || [])]);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Section Settings */}
      <EditorSection
        icon={FaInfoCircle}
        title="FAQ Section Settings"
        description="Configure the title and subtitle for your FAQ section"
        tone="blue"
      >
        <div>
          <label className={labelClass}>
            Section Title
            <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.section?.title || ''}
            onChange={(e) => updateFormData('section.title', e.target.value)}
            placeholder="Frequently Asked Questions"
            className={`${inputClass} mt-1.5`}
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className={labelClass}>
            Section Subtitle
            <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.section?.subtitle || ''}
            onChange={(e) => updateFormData('section.subtitle', e.target.value)}
            placeholder="Find answers to common questions"
            className={`${inputClass} mt-1.5`}
            disabled={isDisabled}
          />
        </div>
      </EditorSection>

      {/* FAQ Items */}
      <EditorSection
        icon={FaRegQuestionCircle}
        title="FAQ Items"
        description={`${totalFaqs} ${totalFaqs === 1 ? 'question' : 'questions'} • New items appear at the top`}
        tone="cyan"
        action={
          <button
            type="button"
            onClick={handleAddFaq}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabled}
          >
            <FaPlus size={11} /> Add FAQ
          </button>
        }
      >
        {totalFaqs === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaRegQuestionCircle size={20} />
            </div>
            <p className="text-sm font-medium text-slate-600">No FAQ items yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click <span className="font-medium text-blue-600">Add FAQ</span> to start
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.faqs.map((faq, index) => (
              <div
                key={faq.id || index}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {index + 1}
                    </span>
                    FAQ Question
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(index, faq)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    disabled={isDisabled}
                    title="Remove FAQ"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Question <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={faq.question || ''}
                      onChange={(e) => updateFormData(`faqs.${index}.question`, e.target.value)}
                      placeholder="Enter the question"
                      className={`${inputClass} mt-1`}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Answer <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={faq.answer || ''}
                      onChange={(e) => updateFormData(`faqs.${index}.answer`, e.target.value)}
                      placeholder="Enter the answer"
                      rows={3}
                      className={`${inputClass} mt-1 resize-y`}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {faq.question && faq.answer && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Preview
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-sm font-medium text-slate-800">
                        {faq.question}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}…` : faq.answer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className={hintClass}>
          <FaLightbulb className="text-amber-400" size={10} />
          New FAQs appear at the top. Drag-to-reorder coming soon.
        </p>
      </EditorSection>

      {/* Tips */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <FaLightbulb className="mt-0.5 shrink-0 text-amber-500" size={13} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">Tips for great FAQs</p>
            <ul className="mt-1.5 space-y-1 text-xs text-amber-800/90">
              <li>• Keep questions clear and concise</li>
              <li>• Write answers in simple, easy-to-understand language</li>
              <li>• Group related questions together</li>
              <li>• Update FAQs regularly based on common questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}