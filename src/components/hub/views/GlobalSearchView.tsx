import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  User, 
  Plane, 
  FileSpreadsheet, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  Phone,
  Tag,
  Clock,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  Hub, 
  Locale, 
  Manifest, 
  OperationalIncident, 
  Shipment, 
  Trip, 
  User as UserType 
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';

export interface GlobalSearchViewProps {
  shipments: Shipment[];
  trips: Trip[];
  manifests: Manifest[];
  incidents: OperationalIncident[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  initialQuery?: string;
  onNavigateToSection?: (section: any, id?: string) => void;
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  shipments,
  trips,
  manifests,
  incidents,
  currentHub,
  currentUser,
  locale,
  initialQuery = '',
  onNavigateToSection,
}) => {
  const isAr = locale === 'ar';
  const [query, setQuery] = useState(initialQuery);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'SHIPMENTS' | 'TRIPS' | 'MANIFESTS' | 'INCIDENTS'>('ALL');

  // Drawer for previewing selected item
  const [selectedItem, setSelectedItem] = useState<{ type: 'SHIPMENT' | 'TRIP' | 'MANIFEST' | 'INCIDENT'; data: any } | null>(null);

  const cleanQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!cleanQuery) {
      return { shipments: [], trips: [], manifests: [], incidents: [], totalCount: 0 };
    }

    const matchedShipments = shipments.filter((s) => {
      return (
        s.id.toLowerCase().includes(cleanQuery) ||
        (s.trackingNumber && s.trackingNumber.toLowerCase().includes(cleanQuery)) ||
        (s.securitySealNumber && s.securitySealNumber.toLowerCase().includes(cleanQuery)) ||
        (s.senderName && s.senderName.toLowerCase().includes(cleanQuery)) ||
        (s.senderPhone && s.senderPhone.toLowerCase().includes(cleanQuery)) ||
        (s.recipientName && s.recipientName.toLowerCase().includes(cleanQuery)) ||
        (s.recipientPhone && s.recipientPhone.toLowerCase().includes(cleanQuery))
      );
    });

    const matchedTrips = trips.filter((t) => {
      return (
        t.id.toLowerCase().includes(cleanQuery) ||
        t.flightNumber.toLowerCase().includes(cleanQuery) ||
        t.travelerName.toLowerCase().includes(cleanQuery) ||
        t.travelerId.toLowerCase().includes(cleanQuery) ||
        (t.airline && t.airline.toLowerCase().includes(cleanQuery))
      );
    });

    const matchedManifests = manifests.filter((m) => {
      return (
        m.id.toLowerCase().includes(cleanQuery) ||
        m.flightNumber.toLowerCase().includes(cleanQuery) ||
        m.travelerName.toLowerCase().includes(cleanQuery) ||
        m.originHubCode.toLowerCase().includes(cleanQuery) ||
        m.destHubCode.toLowerCase().includes(cleanQuery)
      );
    });

    const matchedIncidents = incidents.filter((i) => {
      return (
        i.incidentNumber.toLowerCase().includes(cleanQuery) ||
        (i.trackingNumber && i.trackingNumber.toLowerCase().includes(cleanQuery)) ||
        (i.relatedManifestId && i.relatedManifestId.toLowerCase().includes(cleanQuery)) ||
        (i.flightNumber && i.flightNumber.toLowerCase().includes(cleanQuery)) ||
        i.description.toLowerCase().includes(cleanQuery)
      );
    });

    const totalCount =
      matchedShipments.length +
      matchedTrips.length +
      matchedManifests.length +
      matchedIncidents.length;

    return {
      shipments: matchedShipments,
      trips: matchedTrips,
      manifests: matchedManifests,
      incidents: matchedIncidents,
      totalCount,
    };
  }, [cleanQuery, shipments, trips, manifests, incidents]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="max-w-3xl">
          <h1 className="text-xl font-black text-slate-900">
            {isAr ? 'البحث الشامل في عمليات الفرع' : 'Global Operations Search'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'ابحث فورياً برقم الشحنة، رقم التتبع، الختم الأمني، رقم المانيفست، رقم الرحلة، اسم المسافر أو هاتف المستلم.'
              : 'Search across shipments, trips, manifests, traveler IDs, phone numbers, and security seal numbers.'}
          </p>

          <div className="relative mt-4">
            <input
              type="text"
              autoFocus
              placeholder={
                isAr
                  ? 'أدخل رقم تتبع، ختم أمني، رحلة، مانيفست، اسم أو هاتف...'
                  : 'Search by tracking #, seal ID, flight #, manifest, name, phone...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-2xl ps-11 pe-4 py-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all font-medium shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute start-3.5 top-4 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute end-3 top-3 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-lg"
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({searchResults.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('SHIPMENTS')}
              className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
                activeCategoryFilter === 'SHIPMENTS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'الطرود' : 'Shipments'} ({searchResults.shipments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('TRIPS')}
              className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
                activeCategoryFilter === 'TRIPS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'المسافرون والرحلات' : 'Trips'} ({searchResults.trips.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('MANIFESTS')}
              className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
                activeCategoryFilter === 'MANIFESTS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'المانيفست' : 'Manifests'} ({searchResults.manifests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('INCIDENTS')}
              className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
                activeCategoryFilter === 'INCIDENTS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'الحالات التشغيلية' : 'Incidents'} ({searchResults.incidents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Results sections */}
      {!cleanQuery ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-700 text-sm">
            {isAr ? 'اكتب كلمة البحث للبدء بالاستعلام' : 'Enter search terms to search operations'}
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'يدعم النظام البحث المباشر في قاعدة بيانات فرعك والمطابقات الجارية بأعلى درجات السرعة والأمان.'
              : 'Secure search across local branch assets, manifests, and traveler records.'}
          </div>
        </div>
      ) : searchResults.totalCount === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-700 text-sm">
            {isAr ? 'لم يتم العثور على أي نتائج مطابقة' : 'No matching results found'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isAr ? 'تأكد من صحة رقم التتبع أو المعرف وحاول مجدداً.' : 'Check query spelling or try another identifier.'}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Shipments Section */}
          {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'SHIPMENTS') &&
            searchResults.shipments.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <Package className="w-4 h-4 text-amber-600" />
                  <h2 className="font-bold text-sm text-slate-900">
                    {isAr ? 'الطرود والشحنات' : 'Shipments'} ({searchResults.shipments.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.shipments.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedItem({ type: 'SHIPMENT', data: s })}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {s.trackingNumber || s.id}
                        </span>
                        <StatusBadge domain="SHIPMENT" status={s.status} locale={locale} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{isAr ? 'المرسل' : 'Sender'}</span>
                          <span className="font-semibold text-slate-800 truncate block">{s.senderName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{isAr ? 'المستلم' : 'Recipient'}</span>
                          <span className="font-semibold text-slate-800 truncate block">{s.recipientName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{s.declaredWeightKg} KG</span>
                        {s.securitySealNumber && (
                          <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            Seal: {s.securitySealNumber}
                          </span>
                        )}
                        <span className="text-amber-600 font-sans font-bold flex items-center gap-1">
                          {isAr ? 'عرض' : 'View'} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Trips Section */}
          {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'TRIPS') &&
            searchResults.trips.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <Plane className="w-4 h-4 text-sky-600" />
                  <h2 className="font-bold text-sm text-slate-900">
                    {isAr ? 'رحلات المسافرين المعتمدة والمقترحة' : 'Traveler Trips'} ({searchResults.trips.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.trips.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedItem({ type: 'TRIP', data: t })}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {t.flightNumber} ({t.airline || 'Flight'})
                        </span>
                        <StatusBadge domain="TRIP" status={t.status} locale={locale} size="sm" />
                      </div>

                      <div className="text-xs text-slate-700 mb-2">
                        <div className="font-bold">{t.travelerName}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          {t.originCityAr || t.originHubId} → {t.destCityAr || t.destHubId} | {t.flightDate}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{isAr ? 'السعة:' : 'Capacity:'} {t.availableWeightKg} KG</span>
                        <span className="text-sky-600 font-sans font-bold flex items-center gap-1">
                          {isAr ? 'تفاصيل' : 'Details'} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Manifests Section */}
          {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'MANIFESTS') &&
            searchResults.manifests.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-sm text-slate-900">
                    {isAr ? 'بيانات المانيفست الرقمي' : 'Manifests'} ({searchResults.manifests.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.manifests.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedItem({ type: 'MANIFEST', data: m })}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{m.id}</span>
                        <StatusBadge domain="MANIFEST" status={m.status} locale={locale} size="sm" />
                      </div>

                      <div className="text-xs text-slate-700 mb-2">
                        <div className="font-semibold">{m.travelerName} • {m.flightNumber}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          {m.originHubCode} → {m.destHubCode} | {m.departureDate}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{m.packageCount} {isAr ? 'طرود' : 'pkgs'} ({m.totalWeightKg} KG)</span>
                        <span className="text-indigo-600 font-sans font-bold flex items-center gap-1">
                          {isAr ? 'معاينة' : 'Inspect'} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Incidents Section */}
          {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'INCIDENTS') &&
            searchResults.incidents.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h2 className="font-bold text-sm text-slate-900">
                    {isAr ? 'البلاغات والحالات التشغيلية' : 'Incidents'} ({searchResults.incidents.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedItem({ type: 'INCIDENT', data: inc })}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {inc.incidentNumber}
                        </span>
                        <StatusBadge domain="INCIDENT" status={inc.status} locale={locale} size="sm" />
                      </div>

                      <p className="text-xs text-slate-700 line-clamp-2 mb-2">
                        {inc.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{inc.assignedEmployeeName}</span>
                        <span className="text-rose-600 font-sans font-bold flex items-center gap-1">
                          {isAr ? 'عرض' : 'View'} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Details Preview Drawer */}
      {selectedItem && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={
            selectedItem.type === 'SHIPMENT' ? (isAr ? 'تفاصيل الطرد' : 'Shipment Details') :
            selectedItem.type === 'TRIP' ? (isAr ? 'تفاصيل الرحلة' : 'Trip Details') :
            selectedItem.type === 'MANIFEST' ? (isAr ? 'تفاصيل المانيفست' : 'Manifest Details') :
            (isAr ? 'تفاصيل البلاغ' : 'Incident Details')
          }
          subtitle={selectedItem.data.trackingNumber || selectedItem.data.id || selectedItem.data.incidentNumber}
          locale={locale}
          badge={
            <StatusBadge
              domain={selectedItem.type}
              status={selectedItem.data.status}
              locale={locale}
              size="sm"
            />
          }
          icon={
            selectedItem.type === 'SHIPMENT' ? <Package className="w-5 h-5 text-amber-600" /> :
            selectedItem.type === 'TRIP' ? <Plane className="w-5 h-5 text-sky-600" /> :
            selectedItem.type === 'MANIFEST' ? <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> :
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
              <pre className="text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedItem.data, null, 2)}
              </pre>
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
