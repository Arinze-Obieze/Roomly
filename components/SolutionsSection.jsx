import { MdQuiz, MdVerifiedUser, MdChat } from 'react-icons/md';

const solutions = [
  {
    icon: MdQuiz,
    title: 'Compatibility Quiz',
    description: 'Our in-depth quiz matches you based on lifestyle, habits, and values.'
  },
  {
    icon: MdVerifiedUser,
    title: 'Verified Profiles',
    description: 'We verify identities so you can search with confidence and peace of mind.'
  },
  {
    icon: MdChat,
    title: 'Secure Messaging',
    description: 'Chat with potential flatmates safely without sharing personal contact info.'
  }
];

export default function SolutionsSection() {
  return (
    <section id="features" className="py-8 md:py-16 lg:py-24 bg-accent-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          Roomly: Smarter, Safer Matching
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="flex flex-1 gap-4 rounded-lg md:rounded-2xl bg-card p-4 md:p-8 flex-col items-center text-center">
              <solution.icon className="text-primary text-3xl md:text-4xl mb-2 md:mb-4" />
              <div className="flex flex-col gap-1 md:gap-2">
                <h3 className="text-base md:text-xl font-bold text-text">
                  {solution.title}
                </h3>
                <p className="text-sm md:text-base text-text-muted">
                  {solution.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}