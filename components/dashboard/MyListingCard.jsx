'use client';

import { useState } from 'react';
import { MdEdit, MdDelete, MdLocationOn, MdOutlineBed, MdBathtub } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function MyListingCard({ property, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete property');

      toast.success('Property deleted successfully');
      if (onDelete) onDelete(property.id);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.property_media?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => onEdit(property)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white text-slate-700 shadow-sm transition-colors"
            title="Edit Listing"
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 text-red-500 shadow-sm transition-colors"
            title="Delete Listing"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <MdDelete size={18} />
            )}
          </button>
        </div>
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white text-xs font-medium capitalize">
            {property.property_type}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900 truncate pr-4">
            {property.title}
          </h3>
          <p className="font-bold text-cyan-600 whitespace-nowrap">
            {formatPrice(property.price_per_month)}
            <span className="text-slate-400 text-xs font-normal">/mo</span>
          </p>
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
          <MdLocationOn className="shrink-0" />
          <p className="truncate">
            {property.city}, {property.state}
          </p>
        </div>

        <div className="flex items-center gap-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MdOutlineBed size={18} className="text-slate-400" />
            <span className="text-sm font-medium">{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <MdBathtub size={18} className="text-slate-400" />
            <span className="text-sm font-medium">{property.bathrooms}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
