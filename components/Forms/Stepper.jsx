import React from 'react';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                currentStep > step.id
                  ? 'bg-emerald-500 text-white'
                  : currentStep === step.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {currentStep > step.id ? (
                <step.icon size={20} />
              ) : (
                <step.icon size={20} />
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium hidden sm:block ${
                currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 rounded transition-colors ${
                currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
