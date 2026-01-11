"use client";

import { FilterContent } from "../ui/FilterContent";

export const FilterSidebarContent = () => {
  return (
    <div className="w-full h-full overflow-y-auto pb-6">
      <FilterContent variant="sidebar" />
    </div>
  );
};