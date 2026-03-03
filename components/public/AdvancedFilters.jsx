'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdTune, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { DEFAULT_FILTERS } from '@/core/contexts/FilterContext';

// Filter Atoms
import MoveInDateFilter from './filters/MoveInDateFilter';
import RoomTypeFilter from './filters/RoomTypeFilter';
import HouseRulesFilter from './filters/HouseRulesFilter';
import AmenitiesFilter from './filters/AmenitiesFilter';
import BillsIncludedFilter from './filters/BillsIncludedFilter';
import CompatibilityFilter from './filters/CompatibilityFilter';
import LocationFilter from './filters/LocationFilter';
import PriceFilter from './filters/PriceFilter';

// ─── Section Wrapper ────────────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-bold text-slate-800">{title}</span>
        {open ? (
          <MdExpandLess size={20} className="text-slate-400" />
        ) : (
          <MdExpandMore size={20} className="text-slate-400" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pill Button Rows (for Bedrooms / Bathrooms) ────────────────────
function PillButtonRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            value === opt.value
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const PROPERTY_TYPE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'apartment', label: 'Apartment / Flat' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
];

const BED_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
];

const BATH_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
];

// Count non-default filters to show badge
function countActiveFilters(draft) {
  let count = 0;
  if (draft.location) count++;
  if ((draft.minPrice && draft.minPrice > 0) || (draft.maxPrice && draft.maxPrice < 5000)) count++;
  if (draft.moveInDate && draft.moveInDate !== 'any') count++;
  if (draft.propertyTypes && draft.propertyTypes.length > 0) count++;
  if (draft.roomType && draft.roomType !== 'any') count++;
  if (draft.minBedrooms && draft.minBedrooms > 0) count++;
  if (draft.minBathrooms && draft.minBathrooms > 0) count++;
  if (draft.minCompatibility && draft.minCompatibility > 60) count++;
  if (draft.houseRules && draft.houseRules.length > 0) count++;
  if (draft.amenities && draft.amenities.length > 0) count++;
  if (draft.billsIncluded) count++;
  return count;
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function AdvancedFilters({ filters, onApply, mode = 'panel' }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...filters });

  // Keep draft in sync when external filters reset
  useEffect(() => {
    setDraft({ ...filters });
  }, [filters]);

  const activeCount = countActiveFilters(filters);

  const updateDraft = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(draft);
    setOpen(false);
  };

  const handleReset = () => {
    const reset = { ...DEFAULT_FILTERS };
    setDraft(reset);
    onApply(reset);
    setOpen(false);
  };

  const draftActiveCount = countActiveFilters(draft);

  // ─── Trigger Button ───────────────────────────────────────────────────
  const TriggerButton = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
        open || activeCount > 0
          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
      }`}
    >
      <MdTune size={18} />
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-terracotta-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
          {activeCount}
        </span>
      )}
    </button>
  );

  // ─── Filter Body ───────────────────────────────────────────────────────
  const FilterBody = (
    <div className="overflow-y-auto px-5 flex-1 pb-20">
      <FilterSection title="Location" defaultOpen={true}>
        <LocationFilter
          value={draft.location}
          onChange={(v) => updateDraft('location', v)}
        />
      </FilterSection>

      <FilterSection title="Price (Monthly)" defaultOpen={true}>
        <div className="pt-2">
          <PriceFilter
            minPrice={draft.minPrice}
            maxPrice={draft.maxPrice}
            onChange={(min, max) => setDraft((p) => ({ ...p, minPrice: min, maxPrice: max }))}
            inline
          />
        </div>
      </FilterSection>

      <FilterSection title="Move-in Date" defaultOpen={true}>
        <MoveInDateFilter
          value={draft.moveInDate}
          onChange={(v) => updateDraft('moveInDate', v)}
        />
      </FilterSection>

      <FilterSection title="Property Type" defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 'any') {
                  updateDraft('propertyTypes', []);
                } else {
                  const cur = draft.propertyTypes || [];
                  const next = cur.includes(opt.value)
                    ? cur.filter((v) => v !== opt.value)
                    : [...cur, opt.value];
                  updateDraft('propertyTypes', next);
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                opt.value === 'any'
                  ? (!draft.propertyTypes || draft.propertyTypes.length === 0)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  : (draft.propertyTypes || []).includes(opt.value)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Room Type" defaultOpen={false}>
        <RoomTypeFilter
          value={draft.roomType}
          onChange={(v) => updateDraft('roomType', v)}
        />
      </FilterSection>

      <FilterSection title="Bedrooms" defaultOpen={false}>
        <PillButtonRow
          options={BED_OPTIONS}
          value={draft.minBedrooms || 0}
          onChange={(v) => updateDraft('minBedrooms', v)}
        />
      </FilterSection>

      <FilterSection title="Bathrooms" defaultOpen={false}>
        <PillButtonRow
          options={BATH_OPTIONS}
          value={draft.minBathrooms || 0}
          onChange={(v) => updateDraft('minBathrooms', v)}
        />
      </FilterSection>

      <FilterSection title="Minimum Compatibility" defaultOpen={false}>
        <CompatibilityFilter
          value={draft.minCompatibility ?? 60}
          onChange={(v) => updateDraft('minCompatibility', v)}
        />
      </FilterSection>

      <FilterSection title="House Rules" defaultOpen={false}>
        <HouseRulesFilter
          values={draft.houseRules || []}
          onChange={(v) => updateDraft('houseRules', v)}
        />
      </FilterSection>

      <FilterSection title="Amenities" defaultOpen={false}>
        <AmenitiesFilter
          values={draft.amenities || []}
          onChange={(v) => updateDraft('amenities', v)}
        />
      </FilterSection>

      <FilterSection title="Bills" defaultOpen={false}>
        <BillsIncludedFilter
          value={draft.billsIncluded || false}
          onChange={(v) => updateDraft('billsIncluded', v)}
        />
      </FilterSection>
    </div>
  );

  // ─── Footer ─────────────────────────────────────────────────────────────
  const Footer = (
    <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
      <button
        type="button"
        onClick={handleReset}
        className="text-sm font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2"
      >
        Reset all
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="flex-1 max-w-xs bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-2xl transition-colors text-sm text-center"
      >
        {draftActiveCount > 0 ? `Show results · ${draftActiveCount} active` : 'Show results'}
      </button>
    </div>
  );

  // ─── MOBILE: Slide-up Modal ──────────────────────────────────────────────
  if (mode === 'modal') {
    return (
      <>
        {TriggerButton}
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                onClick={() => setOpen(false)}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl flex flex-col md:hidden"
                style={{ maxHeight: '90dvh' }}
              >
                {/* Handle */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
                  <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                  <h2 className="text-base font-bold text-slate-900">Advanced Filters</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <MdClose size={20} />
                  </button>
                </div>
                {FilterBody}
                {Footer}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── DESKTOP: Inline Collapsible Panel ──────────────────────────────────
  return (
    <div>
      {TriggerButton}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden w-full"
          >
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl mt-3 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                <h2 className="text-base font-bold text-slate-900">Advanced Filters</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <MdClose size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 overflow-y-auto px-6 py-2 flex-1">
                {/* Col 1 */}
                <div>
                  <FilterSection title="Location" defaultOpen={true}>
                    <LocationFilter
                      value={draft.location}
                      onChange={(v) => updateDraft('location', v)}
                    />
                  </FilterSection>
                  <FilterSection title="Move-in Date" defaultOpen={true}>
                    <MoveInDateFilter
                      value={draft.moveInDate}
                      onChange={(v) => updateDraft('moveInDate', v)}
                    />
                  </FilterSection>
                  <FilterSection title="Property Type" defaultOpen={true}>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (opt.value === 'any') {
                              updateDraft('propertyTypes', []);
                            } else {
                              const cur = draft.propertyTypes || [];
                              const next = cur.includes(opt.value)
                                ? cur.filter((v) => v !== opt.value)
                                : [...cur, opt.value];
                              updateDraft('propertyTypes', next);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            opt.value === 'any'
                              ? (!draft.propertyTypes || draft.propertyTypes.length === 0)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                              : (draft.propertyTypes || []).includes(opt.value)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </FilterSection>
                  <FilterSection title="Room Type" defaultOpen={true}>
                    <RoomTypeFilter
                      value={draft.roomType}
                      onChange={(v) => updateDraft('roomType', v)}
                    />
                  </FilterSection>
                </div>

                {/* Col 2 */}
                <div>
                  <FilterSection title="Price (Monthly)" defaultOpen={true}>
                    <div className="pt-2">
                      <PriceFilter
                        minPrice={draft.minPrice}
                        maxPrice={draft.maxPrice}
                        onChange={(min, max) =>
                          setDraft((p) => ({ ...p, minPrice: min, maxPrice: max }))
                        }
                        inline
                      />
                    </div>
                  </FilterSection>
                  <FilterSection title="Bedrooms" defaultOpen={true}>
                    <PillButtonRow
                      options={BED_OPTIONS}
                      value={draft.minBedrooms || 0}
                      onChange={(v) => updateDraft('minBedrooms', v)}
                    />
                  </FilterSection>
                  <FilterSection title="Bathrooms" defaultOpen={true}>
                    <PillButtonRow
                      options={BATH_OPTIONS}
                      value={draft.minBathrooms || 0}
                      onChange={(v) => updateDraft('minBathrooms', v)}
                    />
                  </FilterSection>
                  <FilterSection title="Minimum Compatibility" defaultOpen={true}>
                    <CompatibilityFilter
                      value={draft.minCompatibility ?? 60}
                      onChange={(v) => updateDraft('minCompatibility', v)}
                    />
                  </FilterSection>
                </div>

                {/* Col 3 */}
                <div className="lg:block hidden">
                  <FilterSection title="House Rules" defaultOpen={true}>
                    <HouseRulesFilter
                      values={draft.houseRules || []}
                      onChange={(v) => updateDraft('houseRules', v)}
                    />
                  </FilterSection>
                  <FilterSection title="Amenities" defaultOpen={true}>
                    <AmenitiesFilter
                      values={draft.amenities || []}
                      onChange={(v) => updateDraft('amenities', v)}
                    />
                  </FilterSection>
                  <FilterSection title="Bills" defaultOpen={true}>
                    <BillsIncludedFilter
                      value={draft.billsIncluded || false}
                      onChange={(v) => updateDraft('billsIncluded', v)}
                    />
                  </FilterSection>
                </div>
              </div>
              {Footer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
