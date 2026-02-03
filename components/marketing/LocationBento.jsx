import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function LocationBento() {
  const locations = [
    {
      name: 'Dublin',
      count: '1,240 rooms',
      image: '/images/locations/dublin.png',
      span: 'md:col-span-2 md:row-span-2',
      link: '/rooms?location=Dublin'
    },
    {
      name: 'Cork',
      count: '450 rooms',
      image: '/images/locations/cork.png',
      span: 'md:col-span-2 md:row-span-1',
      link: '/rooms?location=Cork'
    },
    {
      name: 'Belfast',
      count: '210 rooms',
      image: '/images/locations/belfast.png',
      span: 'md:col-span-1 md:row-span-2',
      link: '/rooms?location=Belfast'
    },
    {
      name: 'Galway',
      count: '320 rooms',
      image: '/images/locations/galway.png',
      span: 'md:col-span-1 md:row-span-2',
      link: '/rooms?location=Galway'
    },
    {
      name: 'Limerick',
      count: '180 rooms',
      image: '/images/locations/limerick.png',
      span: 'md:col-span-1 md:row-span-1',
      link: '/rooms?location=Limerick'
    },
    {
      name: 'Waterford',
      count: '120 rooms',
      image: '/images/locations/waterford.png',
      span: 'md:col-span-1 md:row-span-1',
      link: '/rooms?location=Waterford'
    }
  ];

  return (
    <section className="py-16 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 md:mb-16 gap-6">
            <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
                <h2 className="text-4xl md:text-5xl font-sans font-extrabold text-navy-950 mb-4 tracking-tight">
                    Explore Locations
                </h2>
                <p className="text-lg text-slate-500 font-light text-balance text-navy-950/60 leading-relaxed">
                    Find your perfect match in Ireland&apos;s most vibrant cities. 
                    From the creative hubs of Galway to the tech engine of Dublin.
                </p>
            </div>
        </div>

        {/* Bento Grid Layout - Smart 4x3 Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-3 gap-3 md:gap-5 h-[900px] md:h-[800px]">
          {locations.map((loc, i) => (
            <Link 
              key={i} 
              href={loc.link}
              className={`group relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700
                ${loc.span || 'col-span-1 row-span-1'}
                ${i === 1 ? 'col-span-2 md:col-span-2' : ''}
              `}
            >
              <Image 
                src={loc.image} 
                alt={loc.name} 
                fill
                className="absolute inset-0 object-cover transition-transform duration-1000 group-hover:scale-110 ease-out"
                sizes="(max-width: 768px) 50vw, 25vw"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
              />
              {/* Refined Gradient for clear text */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="absolute bottom-8 left-8 right-8 transition-transform duration-500 group-hover:-translate-y-2">
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2 group-hover:text-terracotta-400 transition-colors tracking-tight">
                  {loc.name}
                </h3>
                <div className="text-white/80 text-sm md:text-base font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                  {loc.count}
                </div>
              </div>

              {/* Hover Badge */}
              <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <div className="bg-white text-navy-950 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">
                  Explore
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
