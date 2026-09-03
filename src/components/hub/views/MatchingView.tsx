import React, { useState } from 'react';
import {
  Split,
  Plane,
  CheckCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Scale,
  Calendar,
  Lock,
} from 'lucide-react';
import { Hub, Locale, Shipment, Trip, EmployeeNavSection } from '../../../types';

interface MatchingViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  trips: Trip[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const MatchingView: React.FC<MatchingViewProps> = ({
  currentHub,
  shipments,
  trips,
  locale,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Ready parcels at this hub
  const readyParcels = shipments.filter(
    (s) =>
      (s.originHubId === currentHub.id || !s.originHubId) &&
      (s.currentStatus === 'INSPECTED_AND_SEALED' || s.currentStatus === 'INSPECTED_SEALED')
  );

  // Available trips from this hub
  const availableTrips = trips.filter(
    (t) =>
      (t.originHubId === currentHub.id || !t.originHubId) &&
      (t.status === 'VERIFIED' || t.status === 'CONFIRMED')
  );

  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>(availableTrips[0]?.id || '');
  const [matchSuccessMsg, setMatchSuccessMsg] = useState('');

  const selectedTrip = availableTrips.find((t) => t.id === selectedTripId);

  // Calculate selected total weight
  const selectedParcels = readyParcels.filter((s) => selectedShipmentIds.includes(s.id));
  const selectedWeightKg = Number(
    selectedParcels.reduce((sum, s) => sum + (s.actualWeightKg || s.estimatedWeightKg || 0), 0).toFixed(1)
  );

  const tripRemainingWeightKg = selectedTrip
    ? Math.max(0, selectedTrip.availableWeightKg - (selectedTrip.allocatedWeightKg || 0))
    : 0;

  const isOverweight = selectedWeightKg > tripRemainingWeightKg;

  const handleToggleSelectParcel = (id: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmMatch = () => {
    if (!selectedTrip || selectedShipmentIds.length === 0 || isOverweight) return;

    // Allocate to trip
    selectedTrip.allocatedWeightKg = (selectedTrip.allocatedWeightKg || 0) + selectedWeightKg;
    selectedParcels.forEach((p) => {
      p.currentStatus = 'ASSIGNED_TO_TRIP';
      p.assignedTripId = selectedTrip.id;
      p.assignedTravelerName = selectedTrip.travelerName;
      p.flightNumber = selectedTrip.flightNumber;
      p.airline = selectedTrip.airline;
    });

    setMatchSuccessMsg(
      isAr
        ? `تمت مطابقة وحجز (${selectedShipmentIds.length}) طرد بإجمالي وزن ${selectedWeightKg} كغم على رحلة [${selectedTrip.airline} - ${selectedTrip.flightNumber}] بنجاح!`
        : `Successfully matched (${selectedShipmentIds.length}) parcels (${selectedWeightKg} kg) to flight [${selectedTrip.flightNumber}].`
    );

    setSelectedShipmentIds([]);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Split className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'المطابقة الذكية بين الطرود والرحلات' : 'Smart Parcel & Flight Matching Desk'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تجميع الطرود المفحوصة والمختومة وفق أوزانها وتخصيصها لرحلات المسافرين المعتمدة ذات السعة الشاغرة.'
              : 'Match sealed packages with verified flights respecting weight limits and route schedule.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('MANIFESTS')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          {isAr ? 'الانتقال لبناء المانيفست' : 'Go to Manifest Builder'}
        </button>
      </div>

      {matchSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{matchSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('MANIFESTS')}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs shrink-0"
          >
            {isAr ? 'إصدار المانيفست المشفر' : 'Generate Manifest'}
          </button>
        </div>
      )}

      {/* Split Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sealed Parcels Queue (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                1. {isAr ? 'الطرود المفحوصة الجاهزة' : 'Inspected Parcels'} ({readyParcels.length})
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                {isAr ? 'المحدد:' : 'Selected:'} {selectedShipmentIds.length} ({selectedWeightKg} كغم)
              </span>
            </div>

            {readyParcels.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-700">
                  {isAr ? 'لا توجد طرود بانتظار المطابقة' : 'No parcels ready for match'}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
                {readyParcels.map((shipment) => {
                  const isChecked = selectedShipmentIds.includes(shipment.id);
                  const weight = shipment.actualWeightKg || shipment.estimatedWeightKg || 0;

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => handleToggleSelectParcel(shipment.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-900">
                              {shipment.trackingNumber}
                            </span>
                            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.5 rounded border border-teal-200">
                              {shipment.securitySealId}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5 truncate max-w-xs">
                            {shipment.itemDescription}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {isAr ? 'المرسل:' : 'Sender:'} {shipment.senderName} • {isAr ? 'الوجهة:' : 'Dest:'}{' '}
                            {shipment.recipientName}
                          </div>
                        </div>
                      </div>

                      <div className="font-black text-sm text-slate-900 shrink-0">
                        {weight} <span className="text-[10px] font-medium text-slate-500">كغم</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Available Flight Selection & Matching Confirm (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              2. {isAr ? 'اختر رحلة الطيران المعتمدة للمطابقة' : 'Select Target Flight'}
            </h2>

            {availableTrips.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-700">
                  {isAr ? 'لا توجد رحلات طيران معتمدة ومتاحة' : 'No available verified flights'}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {availableTrips.map((trip) => {
                    const isSelected = selectedTripId === trip.id;
                    const remaining = Math.max(0, trip.availableWeightKg - (trip.allocatedWeightKg || 0));

                    return (
                      <div
                        key={trip.id}
                        onClick={() => setSelectedTripId(trip.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{trip.travelerName}</span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                                {trip.airline} ({trip.flightNumber})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {isAr ? 'موعد الإقلاع:' : 'Departure:'}{' '}
                              {new Date(trip.departureTime).toLocaleDateString()}{' '}
                              <span className="text-[10px]">
                                {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="text-end shrink-0">
                            <div className="text-xs font-bold text-emerald-800">
                              {isAr ? 'المتبقي:' : 'Available:'} {remaining} كغم
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {isAr ? 'من أصل:' : 'of:'} {trip.availableWeightKg} كغم
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Match Summary Indicator */}
                {selectedTrip && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>{isAr ? 'وزن الطرود المختارة:' : 'Selected Parcels Weight:'}</span>
                      <span className={isOverweight ? 'text-rose-600' : 'text-indigo-900'}>
                        {selectedWeightKg} كغم
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{isAr ? 'سعة الرحلة المتبقية:' : 'Flight Capacity Remaining:'}</span>
                      <span className="font-bold text-emerald-700">{tripRemainingWeightKg} كغم</span>
                    </div>

                    {isOverweight && (
                      <div className="p-2 bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold text-center">
                        {isAr
                          ? `الوزن المختار (${selectedWeightKg} كغم) يتجاوز السعة المتبقية (${tripRemainingWeightKg} كغم)! يرجى تقليل الطرود.`
                          : 'Selected weight exceeds available flight capacity!'}
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm Match Button */}
                <button
                  type="button"
                  disabled={selectedShipmentIds.length === 0 || !selectedTrip || isOverweight}
                  onClick={handleConfirmMatch}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isAr
                      ? `تأكيد مطابقة (${selectedShipmentIds.length}) طرد للرحلة`
                      : `Confirm Match (${selectedShipmentIds.length}) to Flight`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
