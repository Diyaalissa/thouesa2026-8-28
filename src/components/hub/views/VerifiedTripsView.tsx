import React, { useState } from 'react';
import {
  BadgeCheck,
  Plane,
  Search,
  Calendar,
  Clock,
  Split,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Hub, Locale, Trip, EmployeeNavSection } from '../../../types';

interface VerifiedTripsViewProps {
  currentHub: Hub;
  trips: Trip[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
}

export const VerifiedTripsView: React.FC<VerifiedTripsViewProps> = ({
  currentHub,
  trips,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  // Verified trips originating from this hub
  const verifiedTrips = trips.filter(
    (t) =>
      (t.originHubId === currentHub.id || !t.originHubId) &&
      (t.status === 'VERIFIED' ||
        t.status === 'CONFIRMED' ||
        t.status === 'PACKAGES_LINKED' ||
        t.status === 'DISPATCHED')
  );

  const filtered = verifiedTrips.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.travelerName.toLowerCase().includes(q) ||
      t.flightNumber.toLowerCase().includes(q) ||
      t.pnrCode.toLowerCase().includes(q) ||
      t.airline.toLowerCase().includes(q)
    );
  });

  const totalCapacityKg = filtered.reduce((acc, t) => acc + (t.availableWeightKg || 0), 0);
  const totalAllocatedKg = filtered.reduce((acc, t) => acc + (t.allocatedWeightKg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'الرحلات المعتمدة والقدرة الاستيعابية' : 'Verified Traveler Flights & Luggage Capacity'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'سجل الرحلات النشطة المؤكدة من إدارة الفرع، استيعاب الأمتعة الشاغرة، وتتبع حجز الطرود.'
              : 'Approved flight schedules, luggage capacity allocation, and manifest matching.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('MATCHING')}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Split className="w-4 h-4" />
            <span>{isAr ? 'بدء المطابقة' : 'Smart Matching'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'الرحلات المعتمدة:' : 'Verified Trips:'}</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{filtered.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'إجمالي السعة المتاحة:' : 'Total Capacity:'}</span>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {totalCapacityKg} <span className="text-xs">كغم</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'السعة المحجوزة:' : 'Allocated Weight:'}</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {totalAllocatedKg} <span className="text-xs">كغم</span>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم الرحلة أو اسم المسافر...' : 'Flight #, airline, traveler...'}
              className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <div className="font-bold text-slate-700">
              {isAr ? 'لا توجد رحلات معتمدة حالياً' : 'No verified trips found'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'المسافر' : 'Traveler'}</th>
                  <th className="p-3 text-start">{isAr ? 'الرحلة والشركة' : 'Flight & Airline'}</th>
                  <th className="p-3 text-start">{isAr ? 'كود PNR' : 'PNR'}</th>
                  <th className="p-3 text-start">{isAr ? 'موعد الإقلاع' : 'Departure'}</th>
                  <th className="p-3 text-start">{isAr ? 'السعة (المتاحة / المحجوزة)' : 'Capacity (Available / Booked)'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.map((trip) => {
                  const remainingKg = Math.max(0, trip.availableWeightKg - (trip.allocatedWeightKg || 0));
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{trip.travelerName}</td>
                      <td className="p-3 font-medium">
                        {trip.airline} <span className="font-mono text-sky-700 font-bold">({trip.flightNumber})</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{trip.pnrCode}</td>
                      <td className="p-3 text-slate-600">
                        {new Date(trip.departureTime).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-slate-400">{new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{trip.availableWeightKg} كغم</span>
                          <span className="text-slate-400">/</span>
                          <span className="font-bold text-emerald-700">{trip.allocatedWeightKg || 0} كغم</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                            {isAr ? `متبقي: ${remainingKg} كغم` : `Remaining: ${remainingKg} kg`}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {trip.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigate('MANIFESTS')}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                        >
                          {isAr ? 'إدراج بالمانيفست' : 'Add to Manifest'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
