import React from 'react';
import { Hub, Locale } from '../../types';
import { MapPin, PhoneCall, ExternalLink } from 'lucide-react';

interface HubContactCardProps {
  hub: Hub;
  locale: Locale;
  type: 'ORIGIN' | 'DESTINATION';
}

export const HubContactCard: React.FC<HubContactCardProps> = ({ hub, locale, type }) => {
  const isAr = locale === 'ar';
  
  const handleDirections = () => {
    // In a real app, open google maps
    window.open(`https://maps.google.com/?q=${hub.lat},${hub.lng}`, '_blank');
  };

  const handleCall = () => {
    // In a real app, dial the hub manager or generic number
    window.location.href = `tel:+1234567890`; // Example placeholder
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${type === 'ORIGIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {type === 'ORIGIN' 
              ? (isAr ? 'مكتب المغادرة (استلام الطرود)' : 'Origin Hub (Pickup)') 
              : (isAr ? 'مكتب الوصول (تسليم الطرود)' : 'Destination Hub (Drop-off)')}
          </h4>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {isAr ? hub.nameAr : hub.nameEn}
          </p>
        </div>
      </div>
      
      <p className="text-xs text-slate-600 mb-4">{hub.address}</p>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleDirections}
          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{isAr ? 'الاتجاهات' : 'Directions'}</span>
        </button>
        <button 
          onClick={handleCall}
          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{isAr ? 'اتصال' : 'Call'}</span>
        </button>
      </div>
    </div>
  );
};
