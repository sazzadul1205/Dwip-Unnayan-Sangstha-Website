// resources/js/components/JobListingSteps/StepWrapper.jsx

export const StepWrapper = ({ children, title, description, isActive, stepNumber }) => {
  return (
    <div className={`transition-all duration-300 ${isActive ? 'block' : 'hidden'}`}>
      <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {stepNumber}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};