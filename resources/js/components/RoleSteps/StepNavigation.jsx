// resources/js/components/RoleSteps/StepNavigation.jsx

import { FaChevronLeft, FaChevronRight, FaCheckCircle } from 'react-icons/fa';

export const StepNavigation = ({
  currentStep,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
  isReviewStep = false,
}) => {
  return (
    <div className="flex justify-between items-center">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${currentStep === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
      >
        <FaChevronLeft size={14} />
        Previous
      </button>

      {isReviewStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FaCheckCircle size={16} />
              Create Role
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          Next
          <FaChevronRight size={14} />
        </button>
      )}
    </div>
  );
};