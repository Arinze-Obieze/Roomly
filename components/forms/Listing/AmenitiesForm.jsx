import { useState } from 'react';
import { MdCheckCircle, MdAdd, MdClose } from 'react-icons/md';
import { AMENITY_GROUPS } from '@/data/listingOptions';
import toast from 'react-hot-toast';

export default function AmenitiesForm({ formData, handleChange }) {
  const [customInput, setCustomInput] = useState('');

  const knownAmenities = AMENITY_GROUPS.flatMap(g => g.items.map(i => i.id));
  const customAmenities = (formData.amenities || []).filter(id => !knownAmenities.includes(id));

  const toggleAmenity = (amenityId) => {
    const current = formData.amenities || [];
    const updated = current.includes(amenityId)
      ? current.filter(id => id !== amenityId)
      : [...current, amenityId];
    handleChange('amenities', updated);
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    
    const newAmenity = customInput.trim();
    const current = formData.amenities || [];
    
    if (current.includes(newAmenity) || knownAmenities.includes(newAmenity)) {
        toast.error('Amenity already selected');
        return;
    }

    handleChange('amenities', [...current, newAmenity]);
    setCustomInput('');
  };

  const removeCustom = (amenity) => {
      const current = formData.amenities || [];
      handleChange('amenities', current.filter(a => a !== amenity));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {AMENITY_GROUPS.map((group) => (
        <div key={group.title}>
            <h3 className="text-lg font-heading font-bold text-navy-950 mb-4">{group.title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {group.items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAmenity(item.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group ${
                            (formData.amenities || []).includes(item.id)
                            ? 'border-terracotta-500 bg-terracotta-50 shadow-sm'
                            : 'border-navy-200 bg-white hover:border-navy-300'
                        }`}
                    >
                        <item.icon 
                            size={22}
                            className={`transition-colors ${
                                (formData.amenities || []).includes(item.id) ? 'text-terracotta-600' : 'text-navy-400 group-hover:text-navy-500'
                            }`}
                        />
                        <span className={`font-heading font-medium ${
                          (formData.amenities || []).includes(item.id) ? 'text-terracotta-900' : 'text-navy-700'
                        }`}>
                            {item.label}
                        </span>
                        {(formData.amenities || []).includes(item.id) ? (
                            <MdCheckCircle className="ml-auto text-terracotta-500" size={20} />
                        ) : (
                            <MdAdd className="ml-auto text-navy-300 group-hover:text-navy-400" size={20} />
                        )}
                    </button>
                ))}
            </div>
        </div>
      ))}

      {/* Custom Amenities */}
      <div>
        <h3 className="text-lg font-heading font-bold text-navy-950 mb-4">Other Amenities</h3>
        <div className="p-4 rounded-xl border border-navy-200 bg-white">
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom(e)}
                    placeholder="e.g. Gym, Concierge, Cinema Room..."
                    className="flex-1 px-4 py-2.5 bg-navy-50 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-sans placeholder-navy-400"
                />
                <button
                    onClick={handleAddCustom}
                    type="button"
                    disabled={!customInput.trim()}
                    className="px-6 py-2 bg-navy-950 text-white rounded-lg font-heading font-medium hover:bg-navy-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add
                </button>
            </div>

            {customAmenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {customAmenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-terracotta-50 text-terracotta-900 rounded-lg border border-terracotta-200">
                            <span className="font-heading font-medium text-sm">{amenity}</span>
                            <button 
                                onClick={() => removeCustom(amenity)}
                                type="button"
                                className="text-terracotta-400 hover:text-terracotta-600"
                            >
                                <MdClose size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-navy-500 italic font-sans">
                    Add any other special features your property offers.
                </p>
            )}
        </div>
      </div>

    </div>
  );
}