// resources/js/pages/Backend/CMS/Shared/Modals/FaqEditor.jsx

import { FaPlus, FaTrash, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function FaqEditor({
  formData,
  updateFormData,
  removeArrayItem,
  isLoading = false,
}) {

  // Check if any upload is in progress
  const isDisabled = isLoading;

  // Handle removing a FAQ item with confirmation
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
      if (result.isConfirmed) {
        removeArrayItem('faqs', index);
      }
    });
  };

  // Handle adding a new FAQ at the top
  const handleAddFaq = () => {
    const newFaq = { id: Date.now(), question: '', answer: '' };
    const currentFaqs = formData.faqs || [];
    // Add to the beginning of the array
    const updatedFaqs = [newFaq, ...currentFaqs];
    updateFormData('faqs', updatedFaqs);
  };

  // Count the total number of FAQ items
  const totalFaqs = (formData.faqs || []).length;

  return (
    <div className="space-y-8 w-full">

      {/* SECTION HEADER */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaInfoCircle className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">FAQ Section Settings</h3>
            <p className="text-xs text-gray-500">Configure the title and subtitle for your FAQ section</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.title || ''}
              onChange={(e) => updateFormData('section.title', e.target.value)}
              placeholder="Frequently Asked Questions"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Subtitle
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.subtitle || ''}
              onChange={(e) => updateFormData('section.subtitle', e.target.value)}
              placeholder="Find answers to common questions"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* FAQ ITEMS SECTION */}
      <div className="bg-linear-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FaQuestionCircle className="text-cyan-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">FAQ Items</h3>
              <p className="text-xs text-gray-500">
                {totalFaqs} {totalFaqs === 1 ? 'question' : 'questions'} • New items appear at the top
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddFaq}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition shadow-sm"
            disabled={isDisabled}
          >
            <FaPlus size={14} />
            Add FAQ
          </button>
        </div>

        {totalFaqs === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaQuestionCircle className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No FAQ items added yet</p>
            <p className="text-xs text-gray-400">Click "Add FAQ" to start building your FAQ section</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.faqs.map((faq, index) => (
              <div
                key={faq.id || index}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-cyan-300 transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    FAQ Question
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(index, faq)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    disabled={isDisabled}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Question <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={faq.question || ''}
                      onChange={(e) => updateFormData(`faqs.${index}.question`, e.target.value)}
                      placeholder="Enter the question"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none"
                      disabled={isDisabled}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Answer <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={faq.answer || ''}
                      onChange={(e) => updateFormData(`faqs.${index}.answer`, e.target.value)}
                      placeholder="Enter the answer"
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none resize-y"
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                {/* Preview */}
                {faq.question && faq.answer && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400 mb-2">Preview:</div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-800 text-sm mb-1">
                        Q: {faq.question}
                      </div>
                      <div className="text-gray-600 text-sm">
                        A: {faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <span>💡</span>
          New FAQs appear at the top. Drag to reorder coming soon.
        </p>
      </div>

      {/* TIPS SECTION */}
      <div className="bg-linear-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <span className="text-amber-600 text-lg">💡</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Tips for Great FAQs</h3>
            <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>Keep questions clear and concise</li>
              <li>Write answers in simple, easy-to-understand language</li>
              <li>Group related questions together</li>
              <li>Update FAQs regularly based on common customer questions</li>
              <li>Include important information that customers frequently ask about</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}