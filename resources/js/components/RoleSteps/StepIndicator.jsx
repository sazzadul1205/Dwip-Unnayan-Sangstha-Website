// resources/js/components/RoleSteps/StepIndicator.jsx

import { FaCheck, FaShieldAlt, FaKey, FaLock, FaEye } from 'react-icons/fa';

export const StepIndicator = ({ currentStep, steps }) => {
  const getStepIcon = (stepId, isActive, isCompleted) => {
    if (isCompleted) {
      return <FaCheck size={16} />;
    }

    const icons = {
      1: <FaShieldAlt size={16} />,
      2: <FaKey size={16} />,
      3: <FaLock size={16} />,
      4: <FaEye size={16} />,
    };
    return icons[stepId] || <FaShieldAlt size={16} />;
  };

  return (
    <div className="py-4">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = currentStep > stepNumber;
              const isActive = currentStep === stepNumber;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : isActive
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white ring-4 ring-purple-200 shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {getStepIcon(stepNumber, isActive, isCompleted)}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-purple-400 opacity-40"></div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-3 text-center">
                    <div className={`
                      text-xs font-medium mb-1
                      ${isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                    `}>
                      Step {stepNumber}
                    </div>
                    <div className={`
                      text-sm font-semibold whitespace-nowrap
                      ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-500'}
                    `}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto pb-4 space-x-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isActive = currentStep === stepNumber;

            return (
              <div key={step.id} className="shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : isActive
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white ring-2 ring-purple-200'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {getStepIcon(stepNumber, isActive, isCompleted)}
                  </div>
                  <div>
                    <div className={`text-xs font-medium ${isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      Step {stepNumber}
                    </div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-6">
                      <div className={`h-0.5 w-6 rounded-full ${currentStep > stepNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};