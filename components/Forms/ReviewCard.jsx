import { MdPhoto, MdLocationOn, MdOutlineBed, MdBathtub, MdSquareFoot } from 'react-icons/md';
import { AMENITIES } from '../CreateListingForm';

export default function ReviewCard({ formData }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Review your listing
        </h2>
        <p className="text-slate-600">
          Make sure everything looks good before publishing
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Preview Card */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-200 aspect-4/3 w-full flex items-center justify-center">
            {formData.photos && formData.photos.length > 0 ? (
              <img
                src={typeof formData.photos[0] === 'string' ? formData.photos[0] : URL.createObjectURL(formData.photos[0])}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <MdPhoto size={64} className="text-slate-400" />
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{formData.title || 'Untitled'}</h3>
              <div className="text-right">
                <div className="font-bold text-lg">€{formData.price_per_month || '0'}</div>
                <div className="text-xs text-slate-500">/mo</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-600 text-sm mb-3">
              <MdLocationOn className="text-emerald-600" />
              {[formData.street, formData.city, formData.state].filter(Boolean).join(', ') || 'No location'}
            </div>
            <div className="flex gap-4 text-sm text-slate-600 mb-3">
              <span className="flex items-center gap-1">
                <MdOutlineBed /> {formData.bedrooms} bed
              </span>
              <span className="flex items-center gap-1">
                <MdBathtub /> {formData.bathrooms} bath
              </span>
              {formData.square_meters && (
                <span className="flex items-center gap-1">
                  <MdSquareFoot /> {formData.square_meters} m²
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {formData.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-1 bg-slate-100 rounded-lg text-xs"
                >
                  {AMENITIES.find(a => a.value === amenity)?.label}
                </span>
              ))}
              {formData.amenities.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">
                  +{formData.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Description */}
        {formData.description && (
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Description</h4>
            <p className="text-slate-600 text-sm">{formData.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
