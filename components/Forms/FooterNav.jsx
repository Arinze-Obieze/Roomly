import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import SubmitButton from './SubmitButton';

export default function FooterNav({ currentStep, STEPS, handleBack, handleNext, handleSubmit, isSubmitting }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentStep === 1
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <MdArrowBack size={20} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all ${
                step.id === currentStep
                  ? 'w-8 bg-terracotta-500'
                  : step.id < currentStep
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all hover:scale-[1.02]"
          >
            <span className="hidden sm:inline">Next</span>
            <MdArrowForward size={20} />
          </button>
        ) : (
          <SubmitButton
            onClick={() => {
              console.log('[FooterNav] Publish Listing button clicked');
              handleSubmit();
            }}
            disabled={isSubmitting}
            className="px-8"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </SubmitButton>
        )}
      </div>
    </div>
  );
}
