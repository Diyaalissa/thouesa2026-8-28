import React, { useState } from 'react';
import { History, Search, ArrowRight, ShieldCheck, FileText, Calendar, User } from 'lucide-react';
import { Locale, RateHistoryEntry } from '../../../types';
import { DetailsDrawer } from '../common/DetailsDrawer';

export interface RateHistoryViewProps {
  history: RateHistoryEntry[];
  locale: Locale;
}

export const RateHistoryView: React.FC<RateHistoryViewProps> = ({
  history,
  locale,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<RateHistoryEntry | null>(null);

  const filteredHistory = history.filter((entry) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.routeAr.toLowerCase().includes(q) ||
      entry.routeEn.toLowerCase().includes(q) ||
      entry.changedByName.toLowerCase().includes(q) ||
      entry.reason.toLowerCase().includes(q) ||
      entry.versionText.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {isAr ? 'سجل تاريخ الأسعار والتعريفات' : 'Shipping Rate Audit History'}
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                {isAr ? 'سجل غير قابل للتعديل أو الحذف' : 'Immutable Audit Trail'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {isAr 
                  ? 'توثيق كامل لكل تغيير على أسعار الشحن مع تحديد الموظف المسؤول والسبب وتاريخ السريان.' 
                  : 'Complete historical record of all rate revisions with author attribution and official rationale.'}
              </span>
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={isAr ? 'بحث في السجل بالمسار أو الموظف...' : 'Search history...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'المسار (Route)' : 'Route'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                <th className="p-3.5 text-start">{isAr ? 'التعديل بالسعر' : 'Rate Change'}</th>
                <th className="p-3.5 text-start">{isAr ? 'تم التغيير بواسطة' : 'Changed By'}</th>
                <th className="p-3.5 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الإصدار' : 'Version'}</th>
                <th className="p-3.5 text-start">{isAr ? 'سبب التعديل' : 'Reason'}</th>
                <th className="p-3.5 text-center">{isAr ? 'تفاصيل' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد سجلات مطابقة' : 'No rate history found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{isAr ? entry.routeAr : entry.routeEn}</div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {entry.originCountry} → {entry.destinationCountry}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">
                        {entry.serviceType === 'SEND_PARCEL'
                          ? (isAr ? 'طرد شخصي' : 'Personal Parcel')
                          : (isAr ? 'اشترِ لي' : 'Buy for Me')}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-400 line-through">{entry.oldRateText}</span>
                        <ArrowRight className="w-3 h-3 text-amber-500" />
                        <span className="text-emerald-700">{entry.newRateText}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{entry.changedByName}</div>
                      <span className="text-[10px] font-mono text-slate-400">{entry.changedBy}</span>
                    </td>

                    <td className="p-3.5 text-slate-600 font-mono">
                      {entry.date}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {entry.versionText}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={entry.reason}>
                      {entry.reason}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        {isAr ? 'عرض' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Drawer */}
      {selectedEntry && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={isAr ? 'تفاصيل تعديل التعرفة' : 'Rate Revision Audit Record'}
          subtitle={selectedEntry.id}
          locale={locale}
          icon={<History className="w-5 h-5 text-amber-600" />}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800">{isAr ? 'بيانات المسار والإصدار' : 'Route & Version'}</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>{isAr ? 'المسار:' : 'Route:'} <span className="font-bold text-slate-900">{isAr ? selectedEntry.routeAr : selectedEntry.routeEn}</span></div>
                <div>{isAr ? 'الإصدار:' : 'Version:'} <span className="font-mono font-bold text-slate-900">{selectedEntry.versionText}</span></div>
                <div>{isAr ? 'الخدمة:' : 'Service:'} <span className="font-bold text-slate-900">{selectedEntry.serviceType}</span></div>
                <div>{isAr ? 'تاريخ التنفيذ:' : 'Date:'} <span className="font-mono font-bold text-slate-900">{selectedEntry.date}</span></div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl font-mono">
              <div className="text-[11px] text-amber-800 font-bold mb-2">{isAr ? 'المقارنة قبل وبعد:' : 'Before vs After:'}</div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'السعر السابق' : 'Old Rate'}</span>
                  <span className="text-sm font-bold text-slate-600">{selectedEntry.oldRateText}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-emerald-600 block text-[10px] font-bold">{isAr ? 'السعر المعتمد الجديد' : 'New Rate'}</span>
                  <span className="text-sm font-bold text-emerald-800">{selectedEntry.newRateText}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 block">{isAr ? 'مذكرة التبرير والسبب:' : 'Audit Reason & Rationale:'}</span>
              <p className="text-slate-700 leading-relaxed">{selectedEntry.reason}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>{isAr ? 'الموظف المسؤول:' : 'Authorized by:'} <strong className="text-slate-900">{selectedEntry.changedByName}</strong> ({selectedEntry.changedBy})</span>
              </div>
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
