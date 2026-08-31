import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, Scale } from 'lucide-react';
import { Locale, Shipment } from '../../types';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  shipment?: Shipment | null;
  locale: Locale;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  shipment,
  locale,
  onClose,
}) => {
  const isAr = locale === 'ar';
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black">
              {shipment ? shipment.itemDescription : (isAr ? 'صورة الطرد المعتمدة' : 'Official Package Photo')}
            </span>
          </div>
          {shipment && (
            <span className="text-[10px] font-mono text-slate-300 block">
              {shipment.trackingNumber} | {shipment.actualWeightKg || shipment.estimatedWeightKg} kg
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-1 gap-1">
            <button
              onClick={handleZoomIn}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title={isAr ? 'تكبير' : 'Zoom In'}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title={isAr ? 'تصغير' : 'Zoom Out'}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title={isAr ? 'إعادة ضبط' : 'Reset Zoom'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
        <img
          src={imageUrl}
          alt="Enlarged package inspection"
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
          onClick={handleZoomIn}
        />
      </div>

      {/* Bottom Footer hint */}
      <div
        className="text-center text-xs text-slate-400 font-medium z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span>
          {isAr
            ? '💡 تم التقاط هذه الصورة في الفرع وتوثيقها لمنع أي تلاعب أو اختلاف في المحتويات'
            : '💡 Intake photo certified at origin branch before tamper sealing.'}
        </span>
      </div>
    </div>
  );
};
