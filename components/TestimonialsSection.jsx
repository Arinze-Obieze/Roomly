'use client';
import { FaStar, FaStarHalf } from 'react-icons/fa';

const testimonials = [
  {
    name: 'Sarah M.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu9G2Lwj0ZpSOq0LnQR1sDrLlEp0j0XyhZzcuJGynx8ISTBWNThHftk81LKXz2HDgKGlOAhtQ5finFPHqgv1cA_o_mKq3ICErxBLFjs2gLdEfcNvgjAFNTYkvGM8jLQZv_IR1IrsvzsNHuAMh6_u4J-6_RUVPXUHyQTnLeMI1t4uhavZZivg6SnmONi1pzGjXPkFbT_zNcV_9aHOuNUs-yHIA8Pt2sUXvztti8zWrtI0q-5fam7gmqrVN5WtCMgyUatzM3VkxF1YI',
    rating: 5,
    text: '"I was dreading the flatmate search, but Roomly made it so easy. Found a brilliant flatmate in just over a week!"'
  },
  {
    name: 'David K.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7wLlxvYfw_ldryX0On9qQTFOnZMYUkz1TJg3aZvIir1g-G5T2eEM8qs_1vkd79ybwbBCYO84rGscvUS7yZ00XnK7erSdxVIES82DpT5Y3yyeA3ztik-OmIIOvtgv_TSu-u1vTDhzl31VYzZln2aRiJt1p5kbJrNEmMOlu3yvTPQs5jD8sQgohE73IJ_z5jFSihsrtHrD0r02EOFbEt_I9Az6jh60JqJ-UHhzOQxtnbK6XPGtB52qXNC1wCfahVAThHmno7A59TT0',
    rating: 4.5,
    text: '"The compatibility quiz is a game-changer. My new flatmate and I clicked instantly. Highly recommend this platform."'
  },
  {
    name: 'Chloe B.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjIhCX8WeAI5_4ALKN1gMEkbNZduYZcGga6zkqi7rSm1Ma1N1NBscxN-JTCJPzJQqwcHYZ38emiC7iBLIZdb-anXmxlKug4elfUWaIVSO7ZnMhvZiFJ8lXjNH59Mt7Pc4AbEom5Y5d3JLwMfyAEEg09JNwkfm-VgCXIN5oFmGeCW9wckNXEScZNe66MHKRUkku7QWNaaHvCSg66e3QmzAbjGs1C44D6AFDN0DWc8W4YakIw8tt-W1MAK-6Nsdf7acdPECHWlFMu95S',
    rating: 5,
    text: '"Felt much safer using a platform that verifies users. The secure messaging is a great feature. Finally found a place I can call home."'
  }
];

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={i} className="text-[16px] text-secondary" />);
  }
  
  if (hasHalfStar) {
    stars.push(<FaStarHalf key="half" className="text-[16px] text-secondary" />);
  }

  return stars;
};

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-8 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold text-center text-text mb-8 md:mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col gap-4 rounded-lg md:rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <img 
                  className="h-12 w-12 rounded-full object-cover" 
                  alt={`Photo of ${testimonial.name}`} 
                  src={testimonial.image} 
                />
                <div>
                  <p className="text-text font-bold">{testimonial.name}</p>
                  <div className="flex">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}