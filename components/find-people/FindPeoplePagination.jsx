'use client';

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 1) return [];

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const normalized = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items = [];

  normalized.forEach((page, index) => {
    const previous = normalized[index - 1];
    if (index > 0 && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }
    items.push(page);
  });

  return items;
}

export default function FindPeoplePagination({
  pagination,
  onPageChange,
  isLoading = false,
}) {
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 0;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;

  if (totalPages <= 1) {
    return total > 0 ? (
      <div className="mt-6 text-sm text-navy-500">
        Showing 1-{Math.min(pageSize, total)} of {total}
      </div>
    ) : null;
  }

  const pageItems = buildPageItems(page, totalPages);
  const start = total === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-navy-500">
        Showing {start}-{end} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isLoading || !pagination?.hasPreviousPage}
          className="rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-heading font-semibold text-navy-700 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {pageItems.map((item) => (
          typeof item === 'string' ? (
            <span key={item} className="px-2 text-navy-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={isLoading}
              aria-current={item === page ? 'page' : undefined}
              className={`min-w-10 rounded-xl border px-3 py-2 text-sm font-heading font-semibold transition-colors ${
                item === page
                  ? 'border-terracotta-500 bg-terracotta-500 text-white'
                  : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-50'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {item}
            </button>
          )
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLoading || !pagination?.hasNextPage}
          className="rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-heading font-semibold text-navy-700 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
