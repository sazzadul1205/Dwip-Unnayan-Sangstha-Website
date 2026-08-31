// resources/js/components/JobListingSteps/StepNavigation.jsx

import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaPen } from 'react-icons/fa';

export const StepNavigation = ({
  currentStep,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
  isReviewStep = false,
  isEdit = false
}) => {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base ${currentStep === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
      >
        <FaChevronLeft size={14} />
        <span>Previous</span>
      </button>

      {isReviewStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base ${isEdit
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{isEdit ? 'Updating...' : 'Posting...'}</span>
            </>
          ) : (
            <>
              {isEdit ? <FaPen size={16} /> : <FaCheckCircle size={16} />}
              <span>{isEdit ? 'Update Job' : 'Post Job'}</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <span>Next</span>
          <FaChevronRight size={14} />
        </button>
      )}
    </div>
  );
};