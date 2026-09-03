import React, { useState } from 'react';
import {
  Plane,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { Hub, Locale, Trip, EmployeeNavSection } from '../../../types';

interface TripVerificationViewProps {
  currentHub: Hub;
  trips: Trip[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const TripVerificationView: React.FC<TripVerificationViewProps> = ({
  currentHub,
  trips,
  locale,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Trips from this hub that are submitted or pending verification
  const hubTrips = trips.filter((t) => t.originHubId === currentHub.id || !t.originHubId);
  const pendingTrips = hubTrips.filter((t) => t.status === 'SUBMITTED' || t.status === 'PENDING');

  const filtered = pendingTrips.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.travelerName.toLowerCase().includes(q) ||
      t.flightNumber.toLowerCase().includes(q) ||
      t.pnrCode.toLowerCase().includes(q) ||
      t.airline.toLowerCase().includes(q)
    );
  });

  const handleApproveTrip = async (trip: Trip) => {
    setIsProcessing(true);
    setNotification(null);
    try {
      // In production calls API /api/admin/trips/:id/verify
      trip.status = 'VERIFIED';
      setNotification({
        type: 'success',
        message: isAr
          ? `تم اعتماد وتوثيق رحلة المسافر [${trip.travelerName}] (${trip.airline} - ${trip.flightNumber}) بنجاح.`
          : `Traveler flight [${trip.flightNumber}] verified successfully. Capacity is unlocked.`,
      });
      setSelectedTrip(null);
      onRefreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error verifying trip' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTrip = async (trip: Trip) => {
    if (!rejectionReason.trim()) {
      alert(isAr ? 'يرجى كتابة سبب الرفض' : 'Please provide a rejection reason');
      return;
    }
    setIsProcessing(true);
    try {
      trip.status = 'REJECTED';
      setNotification({
        type: 'success',
        message: isAr ? `تم رفض الرحلة وإشعار المسافر بالسبب.` : `Trip rejected and traveler notified.`,
      });
      setSelectedTrip(null);
      setRejectionReason('');
      onRefreshData();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              <Plane className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'تدقيق واعتماد رحلات المسافرين' : 'Traveler Flight Verification Desk'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'مراجعة تذاكر الطيران، مطابقة كود PNR، التحقق من السعة الشاغرة للأمتعة، واعتماد الرحلة لاستقبال الطرود.'
              : 'Flight ticket review, PNR code validation, luggage capacity check, and flight activation.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('VERIFIED_TRIPS')}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          {isAr ? 'عرض الرحلات المعتمدة' : 'View Verified Trips'}
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left List + Right Verification Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Trips List (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'رحلات بانتظار الاعتماد' : 'Pending Verification'} ({pendingTrips.length})
              </span>
              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم، الرحلة، PNR...' : 'Flight #, PNR, name...'}
                  className="w-full ps-8 pe-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">
                  {isAr ? 'لا توجد طلبات رحلات جديدة بانتظار التدقيق' : 'No trips pending verification'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{trip.travelerName}</span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                              {trip.airline} ({trip.flightNumber})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            PNR: <strong className="font-mono text-slate-900">{trip.pnrCode}</strong> •{' '}
                            {isAr ? 'السعة:' : 'Capacity:'}{' '}
                            <span className="font-bold text-emerald-700">{trip.availableWeightKg} كغم</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {isAr ? 'تاريخ الرحلة:' : 'Date:'} {new Date(trip.departureTime).toLocaleDateString()}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                          {isAr ? 'جديد' : 'New'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Verification Action Workbench (6 cols) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-sky-600" />
              <span>{isAr ? 'تدقيق تفاصيل التذكرة والمسافر' : 'Flight Audit & Decision'}</span>
            </h2>

            {!selectedTrip ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-600">{isAr ? 'اختر رحلة لتدقيقها' : 'Select a trip to audit'}</div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Trip Details Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'اسم المسافر:' : 'Traveler Name:'}</span>
                    <strong className="text-slate-900">{selectedTrip.travelerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'شركة الطيران ورقم الرحلة:' : 'Flight:'}</span>
                    <span className="font-bold text-slate-900">{selectedTrip.airline} ({selectedTrip.flightNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'رمز الحجز (PNR Code):' : 'PNR Code:'}</span>
                    <span className="font-mono font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                      {selectedTrip.pnrCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'موعد الإقلاع:' : 'Departure Time:'}</span>
                    <span className="font-mono text-slate-800">
                      {new Date(selectedTrip.departureTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'السعة المعروضة للنقل:' : 'Luggage Capacity:'}</span>
                    <span className="font-bold text-emerald-700">{selectedTrip.availableWeightKg} كغم</span>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1.5 text-xs text-sky-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-sky-700" />
                    <span>{isAr ? 'معايير تدقيق رحلة المسافر:' : 'Verification Checklist:'}</span>
                  </div>
                  <ul className="text-[11px] text-sky-900 ps-4 list-disc space-y-0.5">
                    <li>{isAr ? 'مطابقة اسم المسافر مع بطاقة الهوية / جواز السفر' : 'Name matches traveler passport / national ID'}</li>
                    <li>{isAr ? 'صحة رقم الحجز PNR وعدم وجود إلغاء مسبق' : 'Valid PNR reservation code'}</li>
                    <li>{isAr ? 'توفر وزن الأمتعة المسجلة المسموح بها من شركة الطيران' : 'Registered baggage allowance confirmed'}</li>
                  </ul>
                </div>

                {/* Rejection reason if rejecting */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">
                    {isAr ? 'ملاحظات التدقيق أو سبب الرفض (في حال الرفض):' : 'Audit notes / rejection reason:'}
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={isAr ? 'اكتب سبب الرفض هنا في حال عدم مطابقة التذكرة...' : 'Enter reason if rejecting...'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRejectTrip(selectedTrip)}
                    className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isAr ? 'رفض الطلب' : 'Reject Trip'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApproveTrip(selectedTrip)}
                    className="py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'اعتماد الرحلة وتفعيلها' : 'Approve & Activate'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
