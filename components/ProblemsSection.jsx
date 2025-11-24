import { MdHourglassEmpty, MdGroups, MdGppBad } from 'react-icons/md';

const problems = [
  {
    icon: MdHourglassEmpty,
    title: 'Endless Scrolling',
    description: 'Wasting hours on generic listings with no real insight.'
  },
  {
    icon: MdGroups,
    title: 'Incompatible Lifestyles',
    description: 'The stress of living with someone on a completely different page.'
  },
  {
    icon: MdGppBad,
    title: 'Uncertain Safety',
    description: 'Worrying about who you\'re really sharing your home with.'
  }
];

export default function ProblemsSection() {
  return (
    <section id="how-it-works" className="py-8 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          Tired of the Flatmate Gamble?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="flex flex-1 gap-4 rounded-lg md:rounded-2xl border border-border bg-card p-4 md:p-8 flex-col items-center text-center">
              <problem.icon className="text-primary text-3xl md:text-4xl mb-2 md:mb-4" />
              <div className="flex flex-col gap-1 md:gap-2">
                <h3 className="text-base md:text-xl font-bold text-text">
                  {problem.title}
                </h3>
                <p className="text-sm md:text-base text-text-muted">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}