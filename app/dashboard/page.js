"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { 
  MdHome, 
  MdChatBubbleOutline, 
  MdNotificationsNone, 
  MdPersonOutline, 
  MdTune, 
  MdFavoriteBorder, 
  MdLocationOn, 
  MdVerified,
  MdBolt,
  MdSearch,
  MdFilterList,
  MdOutlineBed,
  MdClose,
  MdArrowBack,
  MdMoreVert,
  MdGroups,
  MdAddCircleOutline,
  MdChevronRight,
  MdChevronLeft,
  MdMap,
  MdShare,
  MdTrendingUp,
  MdAccessTime,
  MdCheckCircle,
  MdExpandMore,
  MdExpandLess,
  MdOutlineAttachMoney,
  MdCalendarToday
} from "react-icons/md";
import { FaWifi, FaPaw, FaShower, FaTree, FaCar, FaDumbbell } from "react-icons/fa";
import { TbBuilding, TbBuildingCommunity } from "react-icons/tb";

// ========================
// FILTER STORE (Unified)
// ========================
const FilterContext = createContext();

const DEFAULT_FILTERS = {
  priceRange: 'all',
  bedrooms: [1],
  propertyType: 'any',
  amenities: ['wifi'],
  moveInDate: 'any',
  verifiedOnly: true,
};

const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [savedSearches, setSavedSearches] = useState([
    { id: 1, name: "City Center Studios", filters: { propertyType: 'studio' } },
    { id: 2, name: "Verified Listings", filters: { verifiedOnly: true } },
    { id: 3, name: "1 Bedroom Apartments", filters: { bedrooms: [1] } }
  ]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const saveCurrentSearch = (name) => {
    const newSearch = {
      id: savedSearches.length + 1,
      name,
      filters: { ...filters }
    };
    setSavedSearches(prev => [newSearch, ...prev]);
  };

  const applySavedSearch = (savedFilters) => {
    setFilters(savedFilters);
  };

  return (
    <FilterContext.Provider value={{
      filters,
      savedSearches,
      updateFilters,
      resetFilters,
      saveCurrentSearch,
      applySavedSearch
    }}>
      {children}
    </FilterContext.Provider>
  );
};

const useFilters = () => useContext(FilterContext);

// ========================
// UNIFIED FILTER MODAL
// ========================
const FilterModal = ({ isOpen, onClose, variant = 'modal' }) => {
  const { filters, updateFilters, resetFilters } = useFilters();
  const [activeSection, setActiveSection] = useState('price');

  if (!isOpen && variant === 'modal') return null;

  // For sidebar variant, always render
  if (variant === 'sidebar') {
    return (
      <div className="w-full h-full overflow-y-auto pb-6">
        <FilterContent 
          filters={filters} 
          updateFilters={updateFilters}
          variant="sidebar"
        />
      </div>
    );
  }

  // For modal variant (mobile)
  return (
    <div className="fixed inset-0 z-50 bg-white lg:hidden">
      <div className="h-full flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <MdArrowBack size={24} />
          </button>
          <h2 className="text-lg font-bold">Filters</h2>
          <button 
            onClick={resetFilters}
            className="text-cyan-600 font-semibold text-sm"
          >
            Reset
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto">
          <FilterContent 
            filters={filters} 
            updateFilters={updateFilters}
            variant="modal"
          />
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 p-4">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl"
          >
            Apply Filters • 12 Properties
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterContent = ({ filters, updateFilters, variant }) => {
  const isSidebar = variant === 'sidebar';

  return (
    <div className={`${isSidebar ? 'p-4' : 'p-6'}`}>
      {/* Current Search Summary - SIMPLIFIED */}
      {isSidebar && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Current Search</h3>
            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
              12 matches
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MdLocationOn className="text-cyan-500" size={16} />
              <span>Dublin • {filters.bedrooms.length} bed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MdOutlineAttachMoney className="text-cyan-500" size={16} />
              <span>All price ranges</span>
            </div>
          </div>
        </div>
      )}

      {/* Price Range - SIMPLIFIED */}
      <FilterSection 
        title="Price" 
        isSidebar={isSidebar}
        defaultOpen={isSidebar}
      >
        <div className="grid grid-cols-2 gap-2">
          {['All', 'Budget', 'Mid', 'Premium'].map((range) => (
            <button
              key={range}
              className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${
                filters.priceRange === range.toLowerCase()
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => updateFilters({ priceRange: range.toLowerCase() })}
            >
              {range}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Bedrooms */}
      <FilterSection 
        title="Bedrooms" 
        isSidebar={isSidebar}
      >
        <div className="grid grid-cols-3 gap-2">
          {['Studio', '1', '2', '3+', 'Any'].map((bed) => (
            <button
              key={bed}
              className={`py-2.5 rounded-lg font-medium transition-colors ${
                (bed === 'Studio' && filters.propertyType === 'studio') ||
                (bed === '1' && filters.bedrooms.includes(1)) ||
                (bed === '2' && filters.bedrooms.includes(2)) ||
                (bed === 'Any' && filters.bedrooms.length === 0)
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                if (bed === 'Studio') {
                  updateFilters({ propertyType: filters.propertyType === 'studio' ? 'any' : 'studio' });
                } else if (bed === 'Any') {
                  updateFilters({ bedrooms: [] });
                } else if (bed === '3+') {
                  const newBedrooms = filters.bedrooms.includes(3)
                    ? filters.bedrooms.filter(b => b !== 3)
                    : [...filters.bedrooms, 3];
                  updateFilters({ bedrooms: newBedrooms });
                } else {
                  const num = parseInt(bed);
                  const newBedrooms = filters.bedrooms.includes(num)
                    ? filters.bedrooms.filter(b => b !== num)
                    : [...filters.bedrooms, num];
                  updateFilters({ bedrooms: newBedrooms });
                }
              }}
            >
              {bed}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Amenities */}
      <FilterSection 
        title="Amenities" 
        isSidebar={isSidebar}
      >
        <div className="space-y-2">
          {[
            { icon: FaWifi, label: 'Wifi' },
            { icon: FaPaw, label: 'Pets' },
            { icon: FaCar, label: 'Parking' },
            { icon: FaShower, label: 'Ensuite' },
          ].map((amenity) => (
            <label key={amenity.label} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <amenity.icon className="text-slate-400" size={18} />
                <span className="text-sm font-medium">{amenity.label}</span>
              </div>
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity.label.toLowerCase())}
                onChange={(e) => {
                  const amenityKey = amenity.label.toLowerCase();
                  const newAmenities = e.target.checked
                    ? [...filters.amenities, amenityKey]
                    : filters.amenities.filter(a => a !== amenityKey);
                  updateFilters({ amenities: newAmenities });
                }}
                className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
              />
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Move-in Date */}
      <FilterSection 
        title="Move-in" 
        isSidebar={isSidebar}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-2">
          {['Anytime', 'This Month', 'Next Month', 'Specific'].map((option) => (
            <button
              key={option}
              className={`py-2 text-sm rounded-lg ${
                filters.moveInDate === option.toLowerCase().replace(' ', '_')
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => updateFilters({ 
                moveInDate: option.toLowerCase().replace(' ', '_') 
              })}
            >
              {option}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Verified Only */}
      <div className={`${isSidebar ? 'mt-6' : 'mt-4'}`}>
        <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-3">
            <MdVerified className="text-cyan-500" size={20} />
            <div>
              <p className="text-sm font-medium">Verified Only</p>
              <p className="text-xs text-slate-500">Trusted listings</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilters({ verifiedOnly: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
          />
        </label>
      </div>

      {/* Quick Actions (Sidebar only) */}
      {isSidebar && (
        <div className="mt-6 space-y-2">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            <MdMap size={18} />
            Map View
          </button>
        </div>
      )}
    </div>
  );
};

const FilterSection = ({ title, children, isSidebar, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isSidebar) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full mb-2"
        >
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          {isOpen ? <MdExpandLess size={18} className="text-slate-400" /> : <MdExpandMore size={18} className="text-slate-400" />}
        </button>
        {isOpen && <div className="mb-2">{children}</div>}
      </div>
    );
  }

  // Mobile/Modal variant - always open
  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      {children}
    </div>
  );
};

// ========================
// LEFT SIDEBAR (Desktop) - SIMPLIFIED
// ========================
const LeftSidebar = () => {
  const { savedSearches, applySavedSearch } = useFilters();

  return (
    <aside className="hidden xl:block fixed left-0 top-[120px] w-72 h-[calc(100vh-120px)] bg-white border-r border-slate-200 overflow-y-auto">
      {/* Saved Searches - SIMPLIFIED */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-3">SAVED SEARCHES</h3>
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <button
              key={search.id}
              onClick={() => applySavedSearch(search.filters)}
              className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-50 rounded-lg group"
            >
              <div className="flex items-center gap-2">
                <MdFavoriteBorder className="text-rose-400" size={16} />
                <span className="text-sm text-slate-700">{search.name}</span>
              </div>
              <MdChevronRight className="text-slate-400 group-hover:text-slate-600" size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Filters - SCROLLABLE */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm mb-3">FILTERS</h3>
          <FilterModal variant="sidebar" />
        </div>
      </div>

      {/* Recent Activity - SIMPLIFIED */}
      <div className="p-4 border-t border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-3">RECENT</h3>
        <div className="space-y-2">
          {['Ranelagh', 'Drumcondra', 'Belfield'].map((area, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2 p-2 text-left hover:bg-slate-50 rounded-lg"
            >
              <MdAccessTime className="text-slate-400" size={16} />
              <span className="text-sm text-slate-600">{area}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

// ========================
// MAIN APP COMPONENT
// ========================
export default function HomeDashboard() {
  const [activeTab, setActiveTab] = useState("discover");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <FilterProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Background Texture */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
             style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

        {/* =======================
            DESKTOP HEADER (Two Rows)
        ======================== */}
        <header className="hidden lg:block sticky top-0 z-40 bg-white border-b border-slate-200">
          {/* Row 1: Logo + User Controls */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-lg"></div>
              <h1 className="text-xl font-bold">HomeShareIE</h1>
            </div>

            {/* User Controls */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <MdNotificationsNone size={22} className="text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <img 
                  src="https://i.pravatar.cc/150?u=me" 
                  className="w-8 h-8 rounded-full border border-slate-200" 
                  alt="User" 
                />
                <span className="text-sm font-medium text-slate-700">Alex</span>
              </button>
            </div>
          </div>

          {/* Row 2: Navigation + Search */}
          <div className="flex items-center justify-between px-8 py-3 bg-slate-50/50">
            {/* Left-aligned Navigation */}
            <nav className="flex items-center gap-1">
              <HeaderNavItem 
                icon={MdHome} 
                label="Discover" 
                active={activeTab === "discover"}
                onClick={() => setActiveTab("discover")}
              />
              <HeaderNavItem 
                icon={MdFavoriteBorder} 
                label="Saved" 
                active={activeTab === "saved"}
                onClick={() => setActiveTab("saved")}
              />
              <HeaderNavItem 
                icon={MdChatBubbleOutline} 
                label="Messages" 
                badge="3"
                active={activeTab === "messages"}
                onClick={() => setActiveTab("messages")}
              />
              <HeaderNavItem 
                icon={MdGroups} 
                label="Community" 
                active={activeTab === "community"}
                onClick={() => setActiveTab("community")}
              />
            </nav>

            {/* Center Search Bar */}
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdSearch className="text-slate-400 text-xl" />
              </div>
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
              />
              <button 
                onClick={() => setShowFilters(true)}
                className="absolute inset-y-2 right-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <MdFilterList /> Filters
              </button>
            </div>

            {/* Right-aligned List Property CTA */}
            <button className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-200 transition-all active:scale-[0.98]">
              <MdAddCircleOutline size={20} />
              List Property
            </button>
          </div>
        </header>

        {/* =======================
            MOBILE HEADER (Simplified - No Menu)
        ======================== */}
        <header className={`lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}>
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-lg"></div>
              <h1 className="text-xl font-bold">HomeShareIE</h1>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 relative">
                <MdNotificationsNone size={22} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100">
                <MdPersonOutline size={22} />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="text-slate-400 text-xl" />
              </div>
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-sm"
              />
              <button 
                onClick={() => setShowFilters(true)}
                className="absolute inset-y-1 right-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <MdFilterList size={18} /> Filters
              </button>
            </div>
          </div>
        </header>

        {/* =======================
            FILTER MODAL (Mobile)
        ======================== */}
        <FilterModal 
          isOpen={showFilters} 
          onClose={() => setShowFilters(false)}
        />

        {/* =======================
            LISTING DETAIL MODAL (Mobile)
        ======================== */}
        {selectedListing && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white">
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="flex items-center justify-between p-4">
                  <button 
                    onClick={() => setSelectedListing(null)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                  >
                    <MdArrowBack size={24} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100">
                    <MdMoreVert size={24} />
                  </button>
                </div>
              </div>
              
              <ListingDetail data={selectedListing} />
            </div>
          </div>
        )}

        {/* =======================
            LEFT SIDEBAR (Desktop)
        ======================== */}
        <LeftSidebar />

        {/* =======================
            MAIN CONTENT AREA
        ======================== */}
        <main className="relative min-h-screen xl:pl-72 2xl:pr-80">
          {/* Desktop Welcome Section */}
          <div className="hidden lg:block bg-slate-50 border-b border-slate-200 xl:border-none">
            <div className="px-8 py-6 max-w-6xl mx-auto xl:mx-0 xl:px-12">
              <h2 className="text-xl font-semibold mb-1">Good morning, Alex 👋</h2>
              <p className="text-slate-500 text-sm">Based on your filters, we found 12 great matches in Dublin.</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 lg:px-8 xl:px-12 pb-24 lg:pb-8 pt-4 lg:pt-8">
            <div className="max-w-6xl mx-auto xl:mx-0">
              {/* Filter Pills - SIMPLIFIED */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide mx-4 px-4 lg:mx-0 lg:px-0">
                {["All", "Recommended", "New", "Verified", "Pets"].map((filter, i) => (
                  <button 
                    key={i} 
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
                {listings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    data={listing}
                    onSelect={() => setSelectedListing(listing)}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* =======================
            RIGHT SIDEBAR (Desktop - Large Screens)
        ======================== */}
        <aside className="hidden 2xl:block fixed right-0 top-[120px] w-80 h-[calc(100vh-120px)] bg-white border-l border-slate-200 p-6 overflow-y-auto">
          <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-3xl p-6 text-white mb-8 shadow-lg shadow-cyan-200">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <MdBolt className="text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Update</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Profile Strength</h3>
            <p className="text-sm opacity-90 mb-4">Complete quiz to improve matches.</p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-colors">
              Take Quiz
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Identity Status</h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Level 1</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                  <MdVerified />
                </div>
                <div>
                  <p className="text-sm font-bold">Email Verified</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                  <MdPersonOutline />
                </div>
                <div>
                  <p className="text-sm font-bold">Gov ID Upload</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Community Updates Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Community</h3>
              <MdGroups className="text-cyan-500" />
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-medium">Dublin Roommate Mixer</p>
                <p className="text-xs text-slate-500">Tomorrow • 6 PM</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-medium">5 new members</p>
                <p className="text-xs text-slate-500">Welcome!</p>
              </div>
            </div>
          </div>

          {/* Application Tracker */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4">Your Applications</h3>
            <div className="space-y-3">
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold">Modern Studio</p>
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-xs text-slate-600">Submitted 2 days ago</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold">Ensuite Room</p>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Viewed</span>
                </div>
                <p className="text-xs text-slate-600">Host viewed today</p>
              </div>
            </div>
          </div>
        </aside>

        {/* =======================
            MOBILE BOTTOM NAVIGATION
        ======================== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 py-3 px-2">
          <div className="flex justify-around items-center">
            <BottomNavItem 
              icon={MdHome} 
              label="Discover" 
              active={activeTab === "discover"}
              onClick={() => setActiveTab("discover")}
            />
            <BottomNavItem 
              icon={MdFavoriteBorder} 
              label="Saved" 
              active={activeTab === "saved"}
              onClick={() => setActiveTab("saved")}
            />
            <BottomNavItem 
              icon={MdAddCircleOutline} 
              label="List" 
              active={activeTab === "list"}
              onClick={() => setActiveTab("list")}
            />
            <BottomNavItem 
              icon={MdChatBubbleOutline} 
              label="Chat" 
              badge="3"
              active={activeTab === "messages"}
              onClick={() => setActiveTab("messages")}
            />
            <BottomNavItem 
              icon={MdGroups} 
              label="Community" 
              active={activeTab === "community"}
              onClick={() => setActiveTab("community")}
            />
          </div>
        </nav>
      </div>
    </FilterProvider>
  );
}

// ========================
// REUSABLE COMPONENTS
// ========================

// Desktop Header Navigation Item
function HeaderNavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all relative ${active ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function BottomNavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center p-2 min-w-[60px] ${active ? 'text-cyan-600' : 'text-slate-500'}`}
    >
      <div className="relative">
        <Icon size={22} />
        {badge && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
}

// ========================
// LISTING COMPONENTS (Keep existing)
// ========================

// Mock Data
const listings = [
  {
    id: 1,
    title: "Modern Studio in Ranelagh",
    price: "€1,200",
    period: "mo",
    location: "Ranelagh, Dublin 6",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    matchScore: 98,
    verified: true,
    amenities: [
      { icon: FaWifi, label: "High Speed" },
      { icon: FaPaw, label: "Pet Friendly" }
    ],
    host: { name: "Sarah", avatar: "https://i.pravatar.cc/150?u=sarah" }
  },
  {
    id: 2,
    title: "Ensuite in Shared House",
    price: "€850",
    period: "mo",
    location: "Drumcondra, Dublin 9",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    matchScore: 84,
    verified: true,
    amenities: [
      { icon: FaShower, label: "Ensuite" },
      { icon: FaTree, label: "Garden" }
    ],
    host: { name: "James", avatar: "https://i.pravatar.cc/150?u=james" }
  },
  {
    id: 3,
    title: "Sunny Room near UCD",
    price: "€950",
    period: "mo",
    location: "Belfield, Dublin 4",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    matchScore: 72,
    verified: false,
    amenities: [
      { icon: FaWifi, label: "Wifi" },
      { icon: MdOutlineBed, label: "Double" }
    ],
    host: { name: "Elena", avatar: "https://i.pravatar.cc/150?u=elena" }
  }
];

function ListingCard({ data, onSelect }) {
  return (
    <div 
      onClick={() => onSelect?.()}
      className="group bg-white rounded-2xl lg:rounded-3xl border border-slate-200 overflow-hidden active:scale-[0.98] transition-all duration-200 cursor-pointer lg:hover:shadow-xl lg:hover:-translate-y-1"
    >
      <div className="relative h-48 lg:h-56 overflow-hidden">
        <img 
          src={data.image} 
          alt={data.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-xs">
          <div className={`w-1.5 h-1.5 rounded-full ${data.matchScore > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="font-bold">{data.matchScore}% Match</span>
        </div>

        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-xl">
          <span className="font-bold text-sm lg:text-base">{data.price}</span>
          <span className="text-xs opacity-80">/{data.period}</span>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        <div className="mb-2">
          <h3 className="font-bold text-base lg:text-lg text-slate-900 mb-1 line-clamp-1">{data.title}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <MdLocationOn className="text-cyan-500 flex-shrink-0" />
            <span className="truncate">{data.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 my-3">
          {data.amenities.slice(0, 2).map((am, i) => (
            <div key={i} className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-100">
              <am.icon size={12} /> {am.label}
            </div>
          ))}
          {data.amenities.length > 2 && (
            <div className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-100">
              +{data.amenities.length - 2}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 my-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={data.host.avatar} className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-slate-100" alt={data.host.name} />
            <span className="text-sm font-medium text-slate-700 truncate">{data.host.name}</span>
            {data.verified && <MdVerified className="text-cyan-500 flex-shrink-0" size={18} title="Verified ID" />}
          </div>
          <button className="text-sm font-semibold text-slate-900 hover:text-cyan-600 transition-colors hidden lg:block">
            Details &rarr;
          </button>
          <button className="text-sm font-semibold text-cyan-600 lg:hidden">
            View
          </button>
        </div>
      </div>
    </div>
  );
}

function ListingDetail({ data }) {
  return (
    <div className="p-4">
      <div className="relative h-64 rounded-2xl overflow-hidden mb-4">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl">
            <span className="font-bold">{data.price}</span>
            <span className="text-sm opacity-80">/{data.period}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <MdLocationOn className="text-cyan-500" />
          <span>{data.location}</span>
        </div>

        <div className="bg-gradient-to-r from-cyan-50 to-indigo-50 p-4 rounded-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-bold">Excellent Match: {data.matchScore}%</span>
          </div>
          <p className="text-sm text-slate-600">Based on your lifestyle preferences and sleep schedule</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">Amenities</h3>
        <div className="grid grid-cols-2 gap-3">
          {data.amenities.map((am, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <am.icon className="text-cyan-500" size={20} />
              <span className="font-medium">{am.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">About the Host</h3>
        <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
          <img src={data.host.avatar} className="w-12 h-12 rounded-full" alt={data.host.name} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold">{data.host.name}</span>
              {data.verified && (
                <span className="flex items-center gap-1 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
                  <MdVerified size={12} /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">Usually responds within 1 hour</p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-200">
        <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl mb-3">
          Message Host
        </button>
        <button className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl">
          Save Property
        </button>
      </div>
    </div>
  );
}