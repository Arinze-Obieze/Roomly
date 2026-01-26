'use client';

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Tell us what you need",
      description: "Set your budget, preferred location, and lifestyle preferences. We use this to filter out mismatched rooms instantly."
    },
    {
      num: "02",
      title: "See who you match with",
      description: "Browse verified listings and check your Match Score. See upfront if you’re compatible with the current flatmates."
    },
    {
      num: "03",
      title: "Chat & move in",
      description: "Connect securely through our platform, schedule a viewing, and secure your new home deposit-free."
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight max-w-xl">
                Simple, safe, and stress-free.
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-md">
                We've streamlined every step of the rental process so you can focus on finding your people.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0"></div>

            {steps.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-6 shadow-lg shadow-slate-900/20">
                        {step.num}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                        {step.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
                        {step.description}
                    </p>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
}
