import { MdHome, MdShield } from 'react-icons/md';

const benefits = [
  {
    icon: MdHome,
    title: 'Live Harmoniously',
    description: 'Our compatibility matching goes beyond simple preferences to find someone you\'ll genuinely enjoy living with. From social habits to cleanliness, we cover it all.'
  },
  {
    icon: MdShield,
    title: 'Search with Confidence',
    description: 'With ID verification and a secure platform, you can focus on finding the right personality fit, knowing we\'ve got the safety checks covered.'
  }
];

export default function BenefitsSection() {
  return (
    <section className="py-8 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          How We Make It Easy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-lg md:rounded-2xl border border-border bg-card p-6 md:p-8">
              <benefit.icon className="text-primary text-3xl mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-text">
                {benefit.title}
              </h3>
              <p className="text-sm md:text-base text-text-muted">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}