import React, { useState } from 'react';
import { Trip, Manifest, Shipment, Locale, Hub } from '../../types';
import { 
  ArrowLeft, ArrowRight, Plane, MapPin, Clock, ShieldCheck, 
  FileText, CheckCircle2, Lock, QrCode, AlertTriangle, Image as ImageIcon,
  UploadCloud, Check, Camera, Edit3, XCircle, Info, Package, Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../lib/crypto';
import { EditTripModal, CancelTripModal, EmergencyCancelTripModal } from './TripEditCancelModals';
import { HUBS_DATA } from '../../lib/constants';
import { StatusBadge } from '../common/StatusBadge';
import { BoardingPassCard } from './BoardingPassCard';
import { TripTimeline } from './TripTimeline';
import { HubContactCard } from './HubContactCard';
import { PackingGuideModal } from './PackingGuideModal';

interface TripManagerProps {
  trip: Trip;
  manifests: Manifest[];
  shipments: Shipment[];
  locale: Locale;
  activeHubs?: Hub[];
  onBack: () => void;
  onLockEscrow: (tripId: string) => Promise<boolean>;
  onEmergencyUnassign: (tripId: string, reason: string) => Promise<boolean>;
  onOpenQR: (trip: Trip) => void;
  onViewInspection: (shipment: Shipment) => void;
  onRefreshData?: () => void;
}

export const TripManager: React.FC<TripManagerProps> = ({
  trip, 
  manifests, 
  shipments, 
  locale, 
  activeHubs = HUBS_DATA, 
  onBack, 
  onLockEscrow, 
  onEmergencyUnassign, 
  onOpenQR, 
  onViewInspection, 
  onRefreshData
}) => {
  const isAr = locale === 'ar';
  const ArrowBack = isAr ? ArrowRight : ArrowLeft;
  
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'PACKAGES'>('OVERVIEW');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isEmergencyCancelOpen, setIsEmergencyCancelOpen] = useState(false);
  const [isPackingGuideOpen, setIsPackingGuideOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  if (!trip) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200" dir={isAr ? 'rtl' : 'ltr'}>
        <p className="text-slate-500 mb-4">{isAr ? 'لم يتم العثور على الرحلة المحددة' : 'Selected trip not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          {isAr ? 'العودة لقائمة الرحلات' : 'Back to Trips'}
        </button>
      </div>
    );
  }

  const originHub = (activeHubs && activeHubs.find((h) => h.id === trip.originHubId)) || HUBS_DATA.find((h) => h.id === trip.originHubId);
  const destHub = (activeHubs && activeHubs.find((h) => h.id === trip.destinationHubId)) || HUBS_DATA.find((h) => h.id === trip.destinationHubId);
  
  // Assigned shipments (Anonymous, only barcode/weight/category)
  const tripShipments = shipments ? shipments.filter(s => s.assignedTripId === trip.id || (s.assignedTravelerId === trip.travelerId && s.originHubId === trip.originHubId)) : [];

  // Determine if packages are already allocated
  const hasAllocatedPackages = (trip.allocatedWeightKg || 0) > 0 || ['PACKAGES_LINKED', 'ESCROW_LOCKED', 'IN_TRANSIT'].includes(trip.status);

  // Digital check-in trigger calculation
  const departureDate = new Date(trip.departureTime);
  const diffHours = (departureDate.getTime() - Date.now()) / (1000 * 3600);
  const isCheckInAvailable = !trip.checkedInAt && diffHours <= 48 && diffHours > 0 && ['SCHEDULED', 'VERIFIED'].includes(trip.status);

  // Pre-flight Digital Check-in Action
  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Check-in failed');
      }
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || (isAr ? 'فشل تأكيد السفر الرقمي' : 'Pre-flight check-in failed'));
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors text-xs font-bold shadow-xs cursor-pointer"
        >
          <ArrowBack className="w-4 h-4" />
          <span>{isAr ? 'عودة لقائمة الرحلات' : 'Back to Trips'}</span>
        </button>
        
        <div className="flex items-center gap-2">
          {/* Emergency Cancellation Warning if under review */}
          {trip.emergencyCancelRequested && (
            <div className="px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>{isAr ? 'طلب الإلغاء الطارئ قيد المراجعة' : 'Emergency Cancellation Pending'}</span>
            </div>
          )}

          {/* Standard Edit & Cancel (Only when 0 packages allocated) */}
          {!hasAllocatedPackages && ['SCHEDULED', 'VERIFIED', 'CHECKED_IN'].includes(trip.status) && (
            <>
              <button 
                onClick={() => setIsEditOpen(true)} 
                className="flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-white hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer" 
                title={isAr ? 'تعديل الرحلة' : 'Edit Flight'}
              >
                <Edit3 className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'تعديل' : 'Edit'}</span>
              </button>
              <button 
                onClick={() => setIsCancelOpen(true)} 
                className="flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer" 
                title={isAr ? 'إلغاء الرحلة' : 'Cancel Flight'}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{isAr ? 'إلغاء الرحلة' : 'Cancel'}</span>
              </button>
            </>
          )}

          {/* Emergency Cancellation Request (When packages are allocated) */}
          {hasAllocatedPackages && !trip.emergencyCancelRequested && !['COMPLETED', 'CANCELLED'].includes(trip.status) && (
            <button 
              onClick={() => setIsEmergencyCancelOpen(true)} 
              className="flex items-center gap-2 px-3.5 py-2 text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-xl transition-colors text-xs font-black shadow-xs cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>{isAr ? 'طلب إلغاء طارئ' : 'Emergency Cancel Request'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-200/60 rounded-2xl overflow-x-auto">
        <button 
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          {isAr ? 'التذكرة والمسار المعتمد' : 'Boarding Pass & Route'}
        </button>
        <button 
          onClick={() => setActiveTab('PACKAGES')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'PACKAGES' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <span>{isAr ? 'الطرود المسندة للرحلة' : 'Linked Packages'}</span>
          {tripShipments.length > 0 && (
            <span className="w-5 h-5 bg-teal-600 text-white rounded-full text-[10px] flex items-center justify-center">
              {tripShipments.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Live Flight Boarding Pass */}
          <BoardingPassCard 
            trip={trip} 
            originHub={originHub} 
            destHub={destHub} 
            locale={locale} 
            isCheckInAvailable={isCheckInAvailable} 
            onCheckIn={handleCheckIn}
          />
          
          {/* Operational Timeline (6 Steps) */}
          <TripTimeline trip={trip} locale={locale} />
          
          {/* Hub Office Contact Cards & Packing Guide */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">{isAr ? 'مراكز الشركة المعتمدة للاستلام والتسليم' : 'Official Hub Offices'}</h3>
                <p className="text-[11px] text-slate-500">{isAr ? 'توجه للفرع في الموعد المحدد لمطابقة الهوية واستلام أو تسليم الطرود' : 'Visit the verified hub on schedule for custody handover'}</p>
              </div>
              <button 
                onClick={() => setIsPackingGuideOpen(true)} 
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Info className="w-4 h-4" />
                <span>{isAr ? 'دليل التعبئة الآمنة' : 'Safe Packing Guide'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {originHub && <HubContactCard hub={originHub} locale={locale} type="ORIGIN" />}
              {destHub && <HubContactCard hub={destHub} locale={locale} type="DESTINATION" />}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PACKAGES' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isAr 
                ? 'السرية التامة وإخفاء الهوية: لا يتم عرض أي بيانات شخصية تخص العملاء أو أرقام هواتفهم. الطرود تُعرّف برمز التتبع والباركود المشفر فقط.' 
                : 'Strict Privacy & Anonymity: Customer personal details are masked. Shipments are handled exclusively via verified barcodes.'}
            </p>
          </div>
          
          {tripShipments.length === 0 ? (
            <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700 mb-1">{isAr ? 'لا توجد طرود مسندة حالياً' : 'No packages linked yet'}</h4>
              <p className="text-slate-400 text-xs">
                {isAr 
                  ? 'يقوم فرع المغادرة بتجهيز الطرود وفحصها أمنياً وربطها برحلتك قبل موعد الإقلاع.' 
                  : 'The origin hub inspects, seals, and links packages prior to departure.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tripShipments.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-mono">{s.trackingNumber}</span>
                      <span className="font-bold text-sm text-slate-800">{s.actualWeightKg || s.estimatedWeightKg} {isAr ? 'كغ' : 'KG'}</span>
                      <span className="text-[10px] text-slate-500 block">{s.itemDescription}</span>
                    </div>
                  </div>
                  <div className="text-end space-y-1">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg block">
                      {s.itemCategory}
                    </span>
                    {s.securitySealId && (
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded block">
                        🛡️ {s.securitySealId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <PackingGuideModal isOpen={isPackingGuideOpen} onClose={() => setIsPackingGuideOpen(false)} locale={locale} />
      
      {isEditOpen && (
        <EditTripModal 
          trip={trip} 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          locale={locale} 
          activeHubs={activeHubs} 
          onSuccess={() => { 
            setIsEditOpen(false); 
            if(onRefreshData) onRefreshData(); 
          }} 
        />
      )}
      
      {isCancelOpen && (
        <CancelTripModal 
          trip={trip} 
          isOpen={isCancelOpen} 
          onClose={() => setIsCancelOpen(false)} 
          locale={locale} 
          onSuccess={() => { 
            setIsCancelOpen(false); 
            onBack(); 
            if(onRefreshData) onRefreshData(); 
          }} 
        />
      )}
      
      {isEmergencyCancelOpen && (
        <EmergencyCancelTripModal 
          trip={trip} 
          isOpen={isEmergencyCancelOpen} 
          onClose={() => setIsEmergencyCancelOpen(false)} 
          locale={locale} 
          onSuccess={() => { 
            setIsEmergencyCancelOpen(false); 
            if(onRefreshData) onRefreshData(); 
          }} 
        />
      )}
    </div>
  );
};
