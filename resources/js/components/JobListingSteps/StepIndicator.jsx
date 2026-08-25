// resources/js/components/JobListingSteps/StepIndicator.jsx

// React
import React from 'react';

// Icons
import {
  FaCheck,
  FaBriefcase,
  FaMapMarkerAlt,
  FaClipboardList,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEye
} from 'react-icons/fa';

export const StepIndicator = ({ currentStep, steps }) => {
  const getStepIcon = (stepId, isActive, isCompleted) => {
    // Return check icon for completed steps
    if (isCompleted) {
      return <FaCheck size={16} />;
    }

    // Return appropriate icon based on step ID
    const icons = {
      1: <FaBriefcase size={16} />,
      2: <FaClipboardList size={16} />,
      3: <FaMapMarkerAlt size={16} />,
      4: <FaMoneyBillWave size={16} />,
      5: <FaCalendarAlt size={16} />,
      6: <FaEye size={16} />,
    };
    return icons[stepId] || <FaBriefcase size={16} />;
  };

  return (
    <div className="py-4">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-linear-to-r from-blue-500 to-green-500"
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
                        ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : isActive
                          ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white ring-4 ring-blue-200 shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {getStepIcon(stepNumber, isActive, isCompleted)}

                    {/* Pulse animation for active step */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-40" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-3 text-center">
                    <div className={`
                      text-xs font-medium mb-1
                      ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
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

      {/* Mobile View - Horizontal Scroll */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-thin scrollbar-thumb-gray-300">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isActive = currentStep === stepNumber;

            return (
              <div key={step.id} className="shrink-0">
                <div className="flex items-center gap-3">
                  {/* Step Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted
                        ? 'bg-linear-to-r from-green-500 to-green-600 text-white'
                        : isActive
                          ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-200'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {getStepIcon(stepNumber, isActive, isCompleted)}
                  </div>

                  {/* Step Label */}
                  <div className="min-w-20">
                    <div className={`
                      text-xs font-medium
                      ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                    `}>
                      Step {stepNumber}
                    </div>
                    <div className={`
                      text-sm font-semibold
                      ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-500'}
                    `}>
                      {step.title}
                    </div>
                  </div>

                  {/* Connector for mobile */}
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

        {/* Mobile Progress Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-medium text-blue-600">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-blue-500 to-green-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Step Info - Compact */}
      <div className="mt-4 pt-3 border-t border-gray-100 md:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Current:</span>
          <span className="font-semibold text-blue-600">
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </span>
        </div>
      </div>
    </div>
  );
};