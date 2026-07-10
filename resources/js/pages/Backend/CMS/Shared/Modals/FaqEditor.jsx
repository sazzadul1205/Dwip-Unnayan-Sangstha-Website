// resources/js/pages/Backend/CMS/Shared/Modals/FaqEditor.jsx

import { FaPlus, FaTrash } from 'react-icons/fa6';
import Swal from 'sweetalert2';

export default function FaqEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
}) {
  const isDisabled = isLoading;

  const handleRemoveFaq = (index, faq) => {
    Swal.fire({
      title: 'Remove FAQ?',
      text: `Remove "${faq.question || 'this FAQ'}" from the list?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((result) => {
      if (result.isConfirmed) {
        removeArrayItem('faqs', index);
      }
    });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Section Title
            <span className="text-xs text-gray-400 ml-2">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.section?.title || ''}
            onChange={(e) => updateFormData('section.title', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Frequently Asked Questions"
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Section Subtitle
            <span className="text-xs text-gray-400 ml-2">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.section?.subtitle || ''}
            onChange={(e) => updateFormData('section.subtitle', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Find answers to common questions"
            disabled={isDisabled}
          />
        </div>
      </div>

      <h3 className="font-semibold text-lg pt-4">
        FAQ Items
        <span className="text-xs text-gray-400 ml-2">
          {(formData.faqs || []).length} questions
        </span>
      </h3>
      <p className="text-xs text-gray-500 mb-2">
        Add questions and answers for your FAQ section
      </p>

      {(formData.faqs || []).map((faq, index) => (
        <div key={faq.id || index} className="bg-gray-50 p-4 rounded-lg space-y-3 border-l-4 border-blue-300 w-full">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">FAQ #{index + 1}</span>
            <button
              type="button"
              onClick={() => handleRemoveFaq(index, faq)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
              disabled={isDisabled}
            >
              <FaTrash size={14} />
            </button>
          </div>
          <input
            type="text"
            value={faq.question || ''}
            onChange={(e) => updateFormData(`faqs.${index}.question`, e.target.value)}
            placeholder="Enter question"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
          <textarea
            value={faq.answer || ''}
            onChange={(e) => updateFormData(`faqs.${index}.answer`, e.target.value)}
            placeholder="Enter answer"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => addArrayItem('faqs', { id: Date.now(), question: '', answer: '' })}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
        disabled={isDisabled}
      >
        <FaPlus size={14} /> Add FAQ
      </button>
    </div>
  );
}