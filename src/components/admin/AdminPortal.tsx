import React, { useState } from 'react';
import { 
  ShieldAlert,
  Users,
  Wallet,
  TrendingUp,
  RefreshCw,
  Lock,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  History,
  Plane,
  Box,
  Building2,
  UserPlus,
  Key,
  BadgeCheck,
  BadgePercent,
  Scale,
  Menu,
  X,
} from 'lucide-react';
import { 
  AuditLog,
  ExchangeRate,
  Hub,
  Locale,
  Shipment,
  User,
} from '../../types';
import {  formatCurrency } from '../../lib/crypto';
import {  DEFAULT_EXCHANGE_RATES, HUBS_DATA, INITIAL_EMPLOYEES } from '../../lib/constants';
import {  DashboardCharts } from './DashboardCharts';
import {  ExchangeRatesManager } from './ExchangeRatesManager';
import {  HubsManager } from './HubsManager';
import {  CustomsDutyManager } from './CustomsDutyManager';
import {  DisputesManager } from './DisputesManager';

interface AdminPortalProps {
  currentUser: User;
  users: User[];
  auditLogs: AuditLog[];
  locale: Locale;
  shipments?: Shipment[];
  hubs?: Hub[];
  onApproveKYC: (userId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onTriggerCron: (jobType: string) => Promise<any>;
  onRefreshData: () => void;
  onToggleHubStatus?: (hubId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  users,
  auditLogs,
  locale,
  shipments = [],
  hubs = [],
  onApproveKYC,
  onTriggerCron,
  onRefreshData,
  onToggleHubStatus,
}) => {
  const isAr = locale === 'ar';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'METRICS' | 'EMPLOYEES' | 'DISPUTES' | 'KYC_MANAGER' | 'CUSTOMS_RULES' | 'RATES_LOCK' | 'AUDIT_LOGS' | 'CRON_TERMINAL' | 'SYSTEM_SETTINGS'
  >('METRICS');
  const [selectedUserForKyc, setSelectedUserForKyc] = useState<User | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(DEFAULT_EXCHANGE_RATES);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronLogs, setCronLogs] = useState<string[]>([]);

  // Employee creation state
  const [employeesList, setEmployeesList] = useState(INITIAL_EMPLOYEES);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpHubId, setNewEmpHubId] = useState('hub-mct');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [isCreatingEmp, setIsCreatingEmp] = useState(false);
  const [empSuccessMsg, setEmpSuccessMsg] = useState('');

  const [cronLastResult, setCronLastResult] = useState<{
    success: boolean;
    title: string;
    message: string;
    details?: any;
    executedAt: string;
  } | null>(null);

  const handleCronExecute = async (job: string) => {
    setCronRunning(true);
    try {
      const result = await onTriggerCron(job);
      if (result) {
        const timeStr = new Date().toLocaleTimeString();
        const logEntry = `[${timeStr}] ✅ ${result.message || 'Job finished'} | Execution Details: ${JSON.stringify(
          result.details || {}
        )}`;
        setCronLogs((prev) => [logEntry, ...prev]);
        setCronLastResult({
          success: true,
          title: isAr ? 'تم تشغيل المهمة بنجاح' : 'Cron Task Succeeded',
          message: result.message,
          details: result.details,
          executedAt: timeStr,
        });
      } else {
        const timeStr = new Date().toLocaleTimeString();
        setCronLogs((prev) => [`[${timeStr}] ⚠️ المهمة اكتملت ولكن لم يتم إرجاع تفاصيل`, ...prev]);
      }
    } catch (err: any) {
      const timeStr = new Date().toLocaleTimeString();
      setCronLogs((prev) => [`[${timeStr}] ❌ خطأ أثناء تشغيل المهمة: ${err?.message || err}`, ...prev]);
    } finally {
      setCronRunning(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingEmp(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newEmpName,
          email: newEmpEmail,
          employeeCode: newEmpCode || `EMP-${newEmpHubId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          hubId: newEmpHubId,
          password: newEmpPassword,
        }),
      });
      const data = await res.json();
      if (data.status === 'success' && data.employee) {
        setEmployeesList((prev) => [...prev, data.employee]);
        setEmpSuccessMsg(
          isAr
            ? `تم إنشاء حساب الموظف (${data.employee.fullName}) لفرع ${data.employee.hubNameAr} بنجاح! كود الموظف: ${data.employee.employeeCode}`
            : `Created staff account for ${data.employee.fullName} at ${data.employee.hubNameEn}!`
        );
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpCode('');
        setNewEmpPassword('');
        setTimeout(() => setEmpSuccessMsg(''), 6000);
      } else {
        alert(data.message || 'Error creating employee');
      }
    } catch (err) {
      console.error(err);
      alert('Network error creating employee');
    } finally {
      setIsCreatingEmp(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Admin Top Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">
                {isAr ? 'لوحة الإدارة المركزية والرقابة' : 'Master Admin & General Oversight'}
              </h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-500/30 uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة حسابات موظفي الفروع، الرقابة المالية، أسعار الصرف، وسجل التدقيق'
                : 'Manage hub staff, escrow liquidity, exchange rate locks, and audit logs'}
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshData}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isAr ? 'تحديث البيانات' : 'Refresh Data'}</span>
        </button>
      </header>

      {/* 2. MAIN ADMIN WORKSPACE WITH SIDEBAR NAVIGATION */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Professional Admin Sidebar (Collapsible) */}
        <aside className={`shrink-0 bg-white border-l border-slate-200 transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-0 overflow-y-auto scrollbar-none ${isSidebarOpen ? 'w-72 px-4 py-6' : 'w-20 px-2 py-6 items-center'}`}>
            {isSidebarOpen && (
              <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase flex items-center justify-between mb-4 px-2">
                <span>{isAr ? 'لوحات الإدارة المركزية' : 'Central Admin Modules'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            )}
            
            <div className="space-y-1.5 w-full">
            <button
              onClick={() => setActiveTab('METRICS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'METRICS' ? 'bg-slate-900 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'المؤشرات والسيولة المالية' : 'Financial Liquidity') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'METRICS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'المؤشرات والسيولة المالية' : 'Financial Liquidity'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'METRICS' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isAr ? 'نظرة عامة على المحافظ' : 'Wallet & revenue overview'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between gap-3 px-3.5 py-3' : 'justify-center p-3 relative'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'EMPLOYEES' ? 'bg-amber-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'إدارة حسابات الموظفين' : 'Branch Employees') : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'EMPLOYEES' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                {isSidebarOpen && (
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{isAr ? 'إدارة حسابات الموظفين' : 'Branch Employees'}</div>
                    <div className={`text-[10px] truncate ${activeTab === 'EMPLOYEES' ? 'text-amber-100' : 'text-slate-400'}`}>
                      {isAr ? 'إصدار حسابات الفروع' : 'Manage branch access'}
                    </div>
                  </div>
                )}
              </div>
              {isSidebarOpen ? (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${activeTab === 'EMPLOYEES' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {employeesList.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {employeesList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('DISPUTES')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'DISPUTES' ? 'bg-red-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'النزاعات والتحكيم المالي' : 'Disputes & Arbitration') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'DISPUTES' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>
                <Scale className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'النزاعات والتحكيم المالي' : 'Disputes & Arbitration'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'DISPUTES' ? 'text-red-100' : 'text-slate-400'}`}>
                    {isAr ? 'متابعة وفض النزاعات' : 'Central arbitration'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('KYC_MANAGER')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'KYC_MANAGER' ? 'bg-slate-900 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'توثيق الهويات (KYC)' : 'KYC Approvals') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'KYC_MANAGER' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <BadgeCheck className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'توثيق الهويات (KYC)' : 'KYC Approvals'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'KYC_MANAGER' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isAr ? 'اعتماد المسافرين' : 'Traveler verifications'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('CUSTOMS_RULES')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'CUSTOMS_RULES' ? 'bg-emerald-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'التعريفات الجمركية' : 'Customs Tariffs') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'CUSTOMS_RULES' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                <BadgePercent className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'التعريفات الجمركية' : 'Customs Tariffs'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'CUSTOMS_RULES' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {isAr ? 'تعديل نسب الدول' : 'Update country limits'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('RATES_LOCK')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'RATES_LOCK' ? 'bg-brand-500 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'تثبيت أسعار الصرف' : 'Exchange Rate Locks') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'RATES_LOCK' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-700'}`}>
                <Wallet className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'تثبيت أسعار الصرف' : 'Exchange Rate Locks'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'RATES_LOCK' ? 'text-sky-100' : 'text-slate-400'}`}>
                    {isAr ? 'إدارة العملات والتحويل' : 'Manage currency rates'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'AUDIT_LOGS' ? 'bg-slate-900 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'سجل التدقيق (Audit)' : 'Audit Trail') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'AUDIT_LOGS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <History className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'سجل التدقيق (Audit)' : 'Audit Trail'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'AUDIT_LOGS' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isAr ? 'تتبع الإجراءات الأمنية' : 'Immutable action logs'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('CRON_TERMINAL')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'CRON_TERMINAL' ? 'bg-slate-900 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'محاكي المهام (Cron)' : 'cPanel Cron Terminal') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'CRON_TERMINAL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Play className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'محاكي المهام (Cron)' : 'cPanel Cron Terminal'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'CRON_TERMINAL' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isAr ? 'التسويات التلقائية' : 'Execute background jobs'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('SYSTEM_SETTINGS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'SYSTEM_SETTINGS' ? 'bg-brand-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'إعدادات النظام والفروع' : 'System Hubs') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'SYSTEM_SETTINGS' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'}`}>
                <Globe className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'إعدادات النظام والفروع' : 'System Hubs'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'SYSTEM_SETTINGS' ? 'text-brand-100' : 'text-slate-400'}`}>
                    {isAr ? 'إدارة المواقع الجغرافية' : 'Manage global addresses'}
                  </div>
                </div>
              )}
            </button>
            </div>
        </aside>

        {/* Content Area for Current Active Tab */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6">
          {/* TAB 1: FINANCIAL METRICS & ANALYTICS CHARTS */}
          {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <DashboardCharts locale={locale} />
        </div>
      )}

      {/* TAB 2: BRANCH EMPLOYEES MANAGER */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-6">
          {empSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{empSuccessMsg}</span>
            </div>
          )}

          {/* Create New Employee Form */}
          <form onSubmit={handleCreateEmployee} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-500" />
                <span>{isAr ? 'إنشاء حساب موظف جديد وتعيين الفرع' : 'Create Staff Account & Assign Hub'}</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                {isAr
                  ? 'بصفتك المدير المركزي، يمكنك إنشاء حساب لموظف في سلطنة عُمان أو الجزائر أو أي فرع وتحديد الكود وكلمة المرور'
                  : 'As Central Admin, issue credentials for Oman, Algeria, Jordan, Cairo or Riyadh staff members'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'اسم الموظف الكامل' : 'Employee Full Name'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: سالم بن خلفان المعمري' : 'e.g. Salim Al Maamari'}
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'البريد الإلكتروني / اسم الدخول' : 'Email / Login'}</label>
                <input
                  type="email"
                  required
                  placeholder="salim@thouesa.om"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'الفرع والمركز المعين' : 'Assigned Hub'}</label>
                <select
                  value={newEmpHubId}
                  onChange={(e) => setNewEmpHubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {HUBS_DATA.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'كود الموظف (اختياري / تلقائي)' : 'Employee Code'}</label>
                <input
                  type="text"
                  placeholder="EMP-MCT-102"
                  value={newEmpCode}
                  onChange={(e) => setNewEmpCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'كلمة المرور' : 'Password'}</label>
                <input
                  type="text"
                  required
                  placeholder="Secret password"
                  value={newEmpPassword}
                  onChange={(e) => setNewEmpPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingEmp}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isCreatingEmp ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إنشاء وتفعيل الحساب' : 'Create Staff Account')}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Employees List Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'قائمة موظفي الفروع المركزية النشطين' : 'Active Central Branch Employees'}</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-start">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'كود الموظف' : 'Employee ID'}</th>
                    <th className="p-3 text-start">{isAr ? 'اسم الموظف' : 'Full Name'}</th>
                    <th className="p-3 text-start">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="p-3 text-start">{isAr ? 'الفرع المخصص' : 'Assigned Hub'}</th>
                    <th className="p-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {employeesList.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-brand-500">{emp.employeeCode}</td>
                      <td className="p-3 font-semibold">{emp.fullName}</td>
                      <td className="p-3 font-mono text-slate-500">{emp.email}</td>
                      <td className="p-3 font-semibold">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                          {isAr ? emp.hubNameAr : emp.hubNameEn} ({emp.hubCode})
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <BadgeCheck className="w-3 h-3" />
                          <span>{isAr ? 'نشط ومصرح' : 'Active'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2.5: DISPUTES & ARBITRATION CENTER */}
      {activeTab === 'DISPUTES' && (
        <DisputesManager
          locale={locale}
          employees={employeesList}
          shipments={shipments}
          hubs={hubs}
          onRefreshAll={onRefreshData}
        />
      )}

      {/* TAB 3: KYC MANAGER */}
      {activeTab === 'KYC_MANAGER' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'طلبات التحقق من الهوية الوطنية وجوازات السفر (KYC Documents)' : 'Traveler KYC Verification & Identity Photos'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {users.filter(u => u.kycStatus === 'PENDING').length} {isAr ? 'قيد المراجعة' : 'Pending Review'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'المستخدم والاتصال' : 'User & Contact'}</th>
                  <th className="p-3 text-start">{isAr ? 'الدور والبلد' : 'Role & Country'}</th>
                  <th className="p-3 text-start">{isAr ? 'الجنسية / الهوية' : 'Nationality & ID'}</th>
                  <th className="p-3 text-start">{isAr ? 'حالة KYC' : 'KYC Status'}</th>
                  <th className="p-3 text-start">{isAr ? 'معاينة الوثائق' : 'Inspect Documents'}</th>
                  <th className="p-3 text-start">{isAr ? 'الإجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">
                      <div>{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.phone}</div>
                    </td>
                    <td className="p-3">
                      <div>{u.role}</div>
                      <div className="text-[11px] text-slate-500">{u.country}</div>
                    </td>
                    <td className="p-3">
                      <div>{u.nationality || (u.country === 'DZA' ? 'Algerian' : 'Jordanian')}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.nationalIdNumber || 'ID-REG-2026'}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        u.kycStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {u.kycStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedUserForKyc(u)}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{isAr ? 'فحص الصور' : 'Inspect Photos'}</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveKYC(u.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                        >
                          {isAr ? 'اعتماد' : 'Approve'}
                        </button>
                        <button
                          onClick={() => onApproveKYC(u.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold cursor-pointer"
                        >
                          {isAr ? 'رفض' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KYC Document Inspector Modal */}
          {selectedUserForKyc && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {isAr ? 'وثائق إثبات الهوية وجواز السفر للمستخدم' : 'User KYC & Identity Verification Photos'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedUserForKyc.fullName} — {selectedUserForKyc.phone} ({selectedUserForKyc.email})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUserForKyc(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'بطاقة الهوية الوطنية (الوجه الأمامي)' : 'National ID (Front Side)'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.idDocumentFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80'}
                        alt="ID Front"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'بطاقة الهوية الوطنية (الوجه الخلفي)' : 'National ID (Back Side)'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.idDocumentBackUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80'}
                        alt="ID Back"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'صفحة جواز السفر المعتمدة' : 'Passport Identification Page'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.passportPhotoUrl || 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=500&auto=format&fit=crop&q=80'}
                        alt="Passport"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'صورة شخصية مع الهوية (Selfie)' : 'Selfie with ID'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.selfieWithIdUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                        alt="Selfie verification"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      onApproveKYC(selectedUserForKyc.id, 'REJECTED');
                      setSelectedUserForKyc(null);
                    }}
                    className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl cursor-pointer text-xs"
                  >
                    {isAr ? 'رفض الطلب' : 'Reject KYC'}
                  </button>
                  <button
                    onClick={() => {
                      onApproveKYC(selectedUserForKyc.id, 'APPROVED');
                      setSelectedUserForKyc(null);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs"
                  >
                    {isAr ? 'اعتماد وتوثيق الهوية' : 'Approve & Verify KYC'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3.5: CUSTOMS DUTY & TARIFFS */}
      {activeTab === 'CUSTOMS_RULES' && (
        <CustomsDutyManager
          locale={locale}
          onRefreshGlobalState={onRefreshData}
        />
      )}

      {/* TAB 4: EXCHANGE RATES LOCK & CONTROLS */}
      {activeTab === 'RATES_LOCK' && (
        <ExchangeRatesManager
          locale={locale}
          onRefreshGlobalState={onRefreshData}
        />
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">{isAr ? 'سجل التدقيق المشفر وغير القابل للتعديل' : 'HMAC Verified Immutable Audit Trail'}</h3>

          <div className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">({log.entityType}: {log.entityId})</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.actorRole} • {log.ipAddress}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CPANEL CRON JOBS SIMULATOR */}
      {activeTab === 'CRON_TERMINAL' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'محاكي وإدارة مهام cPanel Cron الدورية' : 'cPanel Cron Scheduler Terminal'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {isAr ? 'متصل بالـ API المباشر' : 'Live API Connected'}
                </span>
              </div>
              <p className="text-slate-500 mt-0.5">
                {isAr
                  ? 'هذه المهام تعمل تلقائياً في خوادم cPanel عبر Cron Jobs. يمكنك تشغيلها يدوياً الآن لمشاهدة تأثيرها الفوري وسجل التدقيق.'
                  : 'Automated background jobs scheduled via cPanel Crontab. Trigger manually to test state transitions.'}
              </p>
            </div>
            {cronRunning && (
              <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جاري التنفيذ والمعالجة...' : 'Executing Task...'}</span>
              </span>
            )}
          </div>

          {/* Last Result Banner */}
          {cronLastResult && (
            <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2 text-emerald-900 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{cronLastResult.title}</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700">{cronLastResult.executedAt}</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-semibold">{cronLastResult.message}</p>
              {cronLastResult.details && (
                <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 font-mono text-[11px] text-emerald-950">
                  تفاصيل المعالجة: {JSON.stringify(cronLastResult.details)}
                </div>
              )}
            </div>
          )}

          {/* Job Trigger Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleCronExecute('CLEANUP')}
              disabled={cronRunning}
              className="p-4 bg-slate-50 hover:bg-brand-50/60 hover:border-brand-300 border border-slate-200 rounded-2xl text-start font-bold transition-all flex items-center justify-between cursor-pointer group shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              <div>
                <span className="block text-slate-900 group-hover:text-brand-600 transition-colors">
                  1. تنظيف الحجوزات المنتهية
                </span>
                <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                  فحص الشحنات المعلقة &gt; 24h وفك حجز الأمتعة
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-brand-400 flex items-center justify-center text-brand-500 shrink-0">
                <Play className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => handleCronExecute('DISPUTE_TIMEOUTS')}
              disabled={cronRunning}
              className="p-4 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 border border-slate-200 rounded-2xl text-start font-bold transition-all flex items-center justify-between cursor-pointer group shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              <div>
                <span className="block text-slate-900 group-hover:text-teal-700 transition-colors">
                  2. معالجة مهل النزاعات التلقائية
                </span>
                <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                  تسوية النزاعات المعلقة وفك تجميد الضمان المالي
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-teal-400 flex items-center justify-center text-teal-600 shrink-0">
                <Play className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => handleCronExecute('DAILY_LEDGER_AUDIT')}
              disabled={cronRunning}
              className="p-4 bg-slate-50 hover:bg-purple-50/60 hover:border-purple-300 border border-slate-200 rounded-2xl text-start font-bold transition-all flex items-center justify-between cursor-pointer group shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              <div>
                <span className="block text-slate-900 group-hover:text-purple-700 transition-colors">
                  3. تدقيق ميزانية القيد المزدوج
                </span>
                <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                  مطابقة رصيد المحافظ والضمان المعلق (Zero Discrepancy)
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-purple-400 flex items-center justify-center text-purple-600 shrink-0">
                <Play className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Cron Output Log Terminal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 font-bold text-[11px]">
              <span>سجل شاشة الأوامر التفاعلية (Interactive Execution Terminal Console):</span>
              <span className="text-slate-400 font-normal">{cronLogs.length} أوامر مسجلة</span>
            </div>
            <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs h-48 overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
              <div className="text-slate-500 flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span>-- THOUESA cPanel Cron Output Console (Ready) --</span>
                <span className="text-[10px] text-emerald-500/70">POST /api/cron/trigger</span>
              </div>
              {cronLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-8">
                  اضغط على أحد الأزرار بالأعلى لتشغيل مهمة المجدول المباشرة ورؤية مخرجات السيرفر...
                </div>
              ) : (
                cronLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed bg-slate-900/40 p-1.5 rounded-md border border-slate-800/40">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM SETTINGS & OFFICIAL HUBS DIRECTORY */}
      {activeTab === 'SYSTEM_SETTINGS' && (
        <HubsManager
          locale={locale}
          onRefreshGlobalState={onRefreshData}
        />
      )}
        </main>
      </div>
    </div>
  );
};
