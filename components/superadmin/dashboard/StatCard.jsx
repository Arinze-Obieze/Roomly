import Link from 'next/link';

const COLOR_MAP = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  loading = false,
  href = null,
}) {
  const colorClass = COLOR_MAP[color] || COLOR_MAP.blue;
  const cardBody = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded my-2"></div>
          ) : (
            <h3 className="text-3xl font-bold font-spaceGrotesk text-slate-900">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        {loading ? (
           <div className="h-4 w-32 bg-slate-100 animate-pulse rounded"></div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{subtitle}</p>
            {href ? <span className="text-xs font-semibold text-slate-700">Open</span> : null}
          </div>
        )}
      </div>
    </>
  );

  if (!href || loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        {cardBody}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      {cardBody}
    </Link>
  );
}
