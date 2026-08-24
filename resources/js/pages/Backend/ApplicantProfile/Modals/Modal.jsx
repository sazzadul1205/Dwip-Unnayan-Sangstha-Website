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
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 z-5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1"
          aria-label="Close modal"
        >
          <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-3 sm:p-6">{children}</div>

      {/* Sticky Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t px-3 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
        >
          {saving ? <FaSpinner className="animate-spin" size={16} /> : <FaSave size={16} />}
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

export default Modal;