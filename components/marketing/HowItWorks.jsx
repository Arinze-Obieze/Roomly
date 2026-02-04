export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Set your vibe",
      description: "Define your budget and lifestyle. We use this to filter out mismatched rooms instantly."
    },
    {
      num: "02",
      title: "Check Match Scores",
      description: "Browse verified listings and see upfront if you’re compatible with current housemates."
    },
    {
      num: "03",
      title: "Connect & Move In",
      description: "Chat securely, schedule a viewing, and secure your new home with total confidence."
    }
  ];

  return (
    <section className="py-16 md:py-40 bg-navy-950 text-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="max-w-3xl mx-auto md:mx-0 text-center md:text-left mb-16 md:mb-32">
            <h2 className="text-3xl md:text-6xl font-sans font-extrabold mb-6 tracking-tight">
                Simple. Safe. <br />
                <span className="text-terracotta-400">Stress-free.</span>
            </h2>
            <p className="text-lg md:text-xl text-navy-200 font-light leading-relaxed text-balance">
                We've streamlined the process so you can focus on finding your people, not just a property.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 relative">
            {/* Background Narrative Line */}
            <div className="hidden md:block absolute top-[50px] left-0 right-0 h-px bg-white/10 -z-0"></div>

            {steps.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left group">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center font-bold text-2xl mb-8 group-hover:bg-terracotta-500 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl">
                        <span className="text-transparent bg-clip-text bg-linear-to-br from-white to-white/40 group-hover:text-white">
                          {step.num}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 tracking-tight">
                        {step.title}
                    </h3>
                    <p className="text-navy-200/70 font-light leading-relaxed text-lg">
                        {step.description}
                    </p>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
}
