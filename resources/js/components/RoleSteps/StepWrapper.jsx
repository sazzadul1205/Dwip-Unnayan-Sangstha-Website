// resources/js/components/RoleSteps/StepWrapper.jsx

export const StepWrapper = ({ children, title, description, isActive, stepNumber }) => {
  return (
    <div className={`transition-all duration-300 ${isActive ? 'block' : 'hidden'}`}>
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isActive
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-500'
            }`}>
            {stepNumber}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};