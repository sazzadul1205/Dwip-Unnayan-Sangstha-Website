// resources/js/Pages/Backend/ApplicantProfile/Modals/Modal.jsx

import { FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

/**
 * Modal Component - Reusable base modal for all profile edit modals
 * 
 * @param {Object} props
 * @param {string} props.title - Modal title displayed in header
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSave - Callback when save button is clicked
 * @param {React.ReactNode} props.children - Modal content
 * @param {boolean} props.saving - Whether save operation is in progress
 */
const Modal = ({ title, onClose, onSave, children, saving }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-1.5 sm:p-2 md:p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[96vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b px-2.5 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 flex justify-between items-center gap-1.5 sm:gap-2 z-10">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-0.5 sm:p-1"
          aria-label="Close modal"
        >
          <FaTimes className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-2.5 sm:p-3 md:p-6">{children}</div>

      {/* Sticky Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t px-2.5 sm:px-3 md:px-6 py-2.5 sm:py-3 md:py-4 flex flex-col-reverse sm:flex-row justify-end gap-1.5 sm:gap-2 md:gap-3">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm md:text-base"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm md:text-base"
        >
          {saving ? <FaSpinner className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" size={16} /> : <FaSave className="h-3.5 w-3.5 sm:h-4 sm:w-4" size={16} />}
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
);

export default Modal;