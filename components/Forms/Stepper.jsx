import React from 'react';

export default function Stepper({ steps, currentStep, furthestStep, onStepClick }) {
  return (
    <div className="mt-6 flex items-center justify-between pointer-events-auto">
      {steps.map((step, index) => {
        // Can click if the step has been reached previously (or current/previous)
        // Default to step.id <= currentStep if furthestStep not provided
        const isClickable = furthestStep ? (step.id <= furthestStep) : (step.id <= currentStep);
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => isClickable && onStepClick && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center flex-1 group focus:outline-none ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-emerald-500 text-white shadow-md'
                    : currentStep === step.id
                    ? 'bg-cyan-500 text-white shadow-md scale-110'
                    : isClickable 
                      ? 'bg-white border-2 border-slate-300 text-slate-500 hover:border-slate-400' 
                      : 'bg-slate-100 text-slate-300'
                }`}
              >
                <step.icon size={20} />
              </div>
              <span
                className={`mt-2 text-xs font-medium hidden sm:block transition-colors ${
                  currentStep >= step.id 
                    ? 'text-slate-900' 
                    : isClickable 
                      ? 'text-slate-500 group-hover:text-slate-700' 
                      : 'text-slate-300'
                }`}
              >
                {step.title}
              </span>
            </button>
            
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-colors duration-500 ${
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
