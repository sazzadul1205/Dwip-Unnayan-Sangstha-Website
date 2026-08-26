// resources/js/components/JobListingSteps/StepIndicator.jsx

import React from 'react';
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
    if (isCompleted) {
      return <FaCheck size={14} />;
    }

    const icons = {
      1: <FaBriefcase size={14} />,
      2: <FaClipboardList size={14} />,
      3: <FaMapMarkerAlt size={14} />,
      4: <FaMoneyBillWave size={14} />,
      5: <FaCalendarAlt size={14} />,
      6: <FaEye size={14} />,
    };
    return icons[stepId] || <FaBriefcase size={14} />;
  };

  return (
    <div className="py-3 sm:py-4">
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
                      relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300
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
                  <div className="mt-2 sm:mt-3 text-center">
                    <div className={`
                      text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1
                      ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                    `}>
                      Step {stepNumber}
                    </div>
                    <div className={`
                      text-xs sm:text-sm font-semibold whitespace-nowrap
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
        <div className="flex overflow-x-auto pb-3 sm:pb-4 space-x-3 sm:space-x-4 scrollbar-thin scrollbar-thumb-gray-300">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isActive = currentStep === stepNumber;

            return (
              <div key={step.id} className="shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Step Circle */}
                  <div
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300
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
                  <div className="min-w-16 sm:min-w-20">
                    <div className={`
                      text-[10px] sm:text-xs font-medium
                      ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                    `}>
                      Step {stepNumber}
                    </div>
                    <div className={`
                      text-xs sm:text-sm font-semibold
                      ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-500'}
                    `}>
                      {step.title}
                    </div>
                  </div>

                  {/* Connector for mobile */}
                  {index < steps.length - 1 && (
                    <div className="w-4 sm:w-6">
                      <div className={`h-0.5 w-4 sm:w-6 rounded-full ${currentStep > stepNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Progress Indicator */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs text-gray-500">Progress</span>
            <span className="text-[10px] sm:text-xs font-medium text-blue-600">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-blue-500 to-green-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Step Info - Compact */}
      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 md:hidden">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Current:</span>
          <span className="font-semibold text-blue-600">
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </span>
        </div>
      </div>
    </div>
  );
};