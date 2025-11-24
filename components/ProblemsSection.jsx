"use client";

import { useState } from "react";
import { FaRegClock, FaUsers, FaLock } from "react-icons/fa";

const problems = [
  {
    icon: FaRegClock,
    title: "The Time Sink",
    description:
      "Traditional searching is a part-time job. You scroll through hundreds of profiles, only to find they are fundamentally incompatible.",
    accent: "text-cyan-500",
    bg: "bg-cyan-100",
  },
  {
    icon: FaUsers,
    title: "The Personality Clash",
    description:
      "Clean freak vs. messy. Night owl vs. early bird. These mismatches aren’t just annoying; they destroy your quality of life.",
    accent: "text-indigo-500",
    bg: "bg-indigo-100",
  },
  {
    icon: FaLock,
    title: "The Safety Gap",
    description:
      "Facebook groups and Gumtree have zero vetting. You're essentially inviting a stranger into your sanctuary based on a profile picture.",
    accent: "text-violet-500",
    bg: "bg-violet-100",
  },
];

export default function ProblemsSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleCard = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "url('https://grainy-gradients.vercel.app/noise.svg')",
        }}
      />

      {/* Soft halo */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            The rental market is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500">
              broken.
            </span>
          </h2>

          <p className="text-lg text-gray-700">
            Current platforms were built for listing properties, not matching people.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            const isOpen = openIndex === index;
            const isOtherOpen = openIndex !== null && openIndex !== index;

            return (
              <div
                key={index}
                className={`bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col self-start transition-all duration-300
                  ${isOpen ? "shadow-md -translate-y-1" : ""}
                  ${isOtherOpen ? "opacity-70 scale-95" : "opacity-100 scale-100"}
                `}
              >
                {/* Header */}
                <button
                  className="w-full flex items-center justify-between p-6"
                  onClick={() => toggleCard(index)}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div
                      className={`w-12 h-12 rounded-xl ${problem.bg} flex items-center justify-center`}
                    >
                      <Icon className={`text-xl ${problem.accent}`} />
                    </div>

                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      {problem.title}
                    </h3>
                  </div>

                  <div className="text-2xl text-gray-400">{isOpen ? "–" : "+"}</div>
                </button>

                {/* Body: only render when open */}
                {isOpen && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed transition-all duration-300">
                    {problem.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
