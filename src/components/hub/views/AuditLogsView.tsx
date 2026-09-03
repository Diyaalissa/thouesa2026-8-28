import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  Clock,
  User,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Hub, Locale, EmployeeNavSection } from '../../../types';

interface AuditLogsViewProps {
  currentHub: Hub;
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  employeeName: string;
  actionType: 'INTAKE' | 'INSPECTION' | 'MANIFEST_ISSUE' | 'DISPATCH' | 'DELIVERY' | 'FX_SETTLEMENT' | 'INCIDENT';
  referenceId: string;
  description: string;
  ipAddress: string;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  currentHub,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Initial audit log events
  const [auditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'AUD-8821',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      employeeName: 'أحمد الحنيطي (Counter Specialist)',
      actionType: 'INTAKE',
      referenceId: 'TH-AMM-0081',
      description: 'تم إنشاء شحنة جديدة واستلام الطرد الفعلي وتسجيل الوزن 2.5 كغم',
      ipAddress: '192.168.1.44 (Terminal-01)',
    },
    {
      id: 'AUD-8820',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      employeeName: 'سارة النجار (Inspection Officer)',
      actionType: 'INSPECTION',
      referenceId: 'TH-AMM-0081',
      description: 'فحص أمني ناجح عبر جهاز الفحص بالأشعة وتركيب الختم الأمني SEAL-JO-4921',
      ipAddress: '192.168.1.48 (Inspection-Station-02)',
    },
    {
      id: 'AUD-8819',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      employeeName: 'محمد العمري (Shift Supervisor)',
      actionType: 'MANIFEST_ISSUE',
      referenceId: 'MF-AMM-4091',
      description: 'إصدار مانيفست الرحلة الجوية RJ-511 وتشفير رمز الـ QR للتسليم',
      ipAddress: '192.168.1.10 (Supervisor-PC)',
    },
    {
      id: 'AUD-8818',
      timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
      employeeName: 'أحمد الحنيطي (Counter Specialist)',
      actionType: 'FX_SETTLEMENT',
      referenceId: 'STL-9042',
      description: 'تحصيل مبلغ شحن 32.5 JOD نقداً وإيداعه بالخزينة',
      ipAddress: '192.168.1.44 (Terminal-01)',
    },
    {
      id: 'AUD-8817',
      timestamp: new Date(Date.now() - 140 * 60000).toISOString(),
      employeeName: 'سارة النجار (Inspection Officer)',
      actionType: 'DISPATCH',
      referenceId: 'MF-AMM-4089',
      description: 'تسليم حقيبة النقل المشفرة للمسافر يوسف القاضي بعد مطابقة جواز السفر',
      ipAddress: '192.168.1.48 (Handover-Desk)',
    },
    {
      id: 'AUD-8816',
      timestamp: new Date(Date.now() - 210 * 60000).toISOString(),
      employeeName: 'ليلى بن سالم (Destination Agent)',
      actionType: 'DELIVERY',
      referenceId: 'TH-ALG-0072',
      description: 'تسليم نهائي للطرد للمستلم بموجب مطابقة الهوية ورمز التحقق OTP 9842',
      ipAddress: '192.168.2.14 (Counter-ALG)',
    },
  ]);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'ALL' && log.actionType !== filterType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.referenceId.toLowerCase().includes(q) ||
      log.employeeName.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'سجل التدقيق الأمني وتسليم الورديات' : 'Security Audit Trail & Shift Handover'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'سجل غير قابل للتعديل (Immutable Log) لجميع الحركات التشغيلية، الإجراءات الرقابية، وتسليم الخزينة بين الموظفين.'
              : 'Tamper-proof audit logs for operational actions, compliance oversight, and shift reconciliation.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'حماية مشفرة مفعلة' : 'Encrypted & Audited'}</span>
          </span>
        </div>
      </div>

      {/* Shift Handover Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>{isAr ? 'تقرير الوردية الحالية (Shift 01 - Morning)' : 'Current Shift Handover Status'}</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? 'وردية نشطة' : 'Active Shift'}</span>
          </span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">{isAr ? 'الموظف المسؤول:' : 'Lead Employee:'}</span>
            <strong className="text-slate-900">أحمد الحنيطي</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">{isAr ? 'الطرود المعالجة:' : 'Processed Parcels:'}</span>
            <strong className="text-emerald-700 font-mono text-sm">18 طرد</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">{isAr ? 'رصيد فتح الصندوق:' : 'Opening Cash:'}</span>
            <strong className="text-slate-900 font-mono">500.00 JOD</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">{isAr ? 'رصيد الصندوق الحالي:' : 'Current Drawer Cash:'}</span>
            <strong className="text-indigo-900 font-mono text-sm">845.50 JOD</strong>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم الشحنة، الموظف، أو الوصف...' : 'Search logs...'}
              className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold">{isAr ? 'تصفية حسب:' : 'Filter:'}</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="ALL">{isAr ? 'جميع العمليات' : 'All Actions'}</option>
              <option value="INTAKE">{isAr ? 'استقبال الطرود' : 'Intake'}</option>
              <option value="INSPECTION">{isAr ? 'الفحص والأختام' : 'Inspection'}</option>
              <option value="MANIFEST_ISSUE">{isAr ? 'إصدار المانيفست' : 'Manifest'}</option>
              <option value="DISPATCH">{isAr ? 'تسليم المسافر' : 'Dispatch'}</option>
              <option value="DELIVERY">{isAr ? 'تسليم المستلم' : 'Delivery'}</option>
              <option value="FX_SETTLEMENT">{isAr ? 'تسوية مالية' : 'FX & Cash'}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-start">{isAr ? 'الوقت' : 'Timestamp'}</th>
                <th className="p-3 text-start">{isAr ? 'الموظف' : 'Employee'}</th>
                <th className="p-3 text-start">{isAr ? 'نوع الإجراء' : 'Action'}</th>
                <th className="p-3 text-start">{isAr ? 'المرجع' : 'Reference'}</th>
                <th className="p-3 text-start">{isAr ? 'التفاصيل' : 'Details'}</th>
                <th className="p-3 text-start">{isAr ? 'المحطة / IP' : 'Station'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3 font-bold text-slate-900">{log.employeeName}</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-sky-800">{log.referenceId}</td>
                  <td className="p-3 text-slate-700 max-w-sm">{log.description}</td>
                  <td className="p-3 text-slate-400 font-mono text-[10px]">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
