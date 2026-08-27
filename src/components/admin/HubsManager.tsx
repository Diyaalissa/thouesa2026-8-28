import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Power,
  Edit3,
  Trash2,
  RefreshCw,
  Phone,
  Clock,
  UserCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Package,
  ShieldCheck,
  Layers,
  Save,
  X,
  Globe,
} from 'lucide-react';
import { Hub, Locale } from '../../types';
import { HUBS_DATA } from '../../lib/constants';

interface HubWithStats extends Hub {
  inboundQueue?: number;
  inspectedQueue?: number;
  destinationArrivals?: number;
}

interface HubsManagerProps {
  locale: Locale;
  onRefreshGlobalState?: () => void;
}

export const HubsManager: React.FC<HubsManagerProps> = ({
  locale,
  onRefreshGlobalState,
}) => {
  const isAr = locale === 'ar';
  const [hubs, setHubs] = useState<HubWithStats[]>(HUBS_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Add Hub Modal State (Streamlined to 5 core inputs)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingNewHub, setIsSavingNewHub] = useState(false);
  const [newHubForm, setNewHubForm] = useState({
    countryCode: 'JOR',
    address: '',
    phone: '',
    managerName: '',
    operatingHours: '08:00 - 22:00 يومياً',
  });

  // Edit Hub Modal State
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editHubForm, setEditHubForm] = useState({
    phone: '',
    managerName: '',
    operatingHours: '',
    address: '',
    nameAr: '',
    nameEn: '',
    cityAr: '',
    cityEn: '',
    storageCapacityKg: 2000,
  });

  const fetchHubs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      if (data.success && data.hubs) {
        setHubs(data.hubs);
      }
    } catch (err) {
      console.error('Error fetching hubs:', err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'فشل تحميل قائمة الفروع' : 'Failed to fetch hubs list',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleToggleHub = async (hubId: string) => {
    try {
      const res = await fetch(`/api/hubs/${hubId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: data.message,
        });
        await fetchHubs();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'فشل تغيير حالة الفرع' : 'Failed to toggle hub status'),
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في الاتصال بالخادم' : 'Network error toggling hub',
      });
    }
  };

  const handleDeleteHub = async (hub: Hub) => {
    if (
      !window.confirm(
        isAr
          ? `هل أنت متأكد من حذف الفرع الرسمي (${hub.nameAr} - ${hub.code}) نهائياً؟`
          : `Are you sure you want to decommission hub ${hub.nameEn} (${hub.code})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/hubs/${hub.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: data.message,
        });
        await fetchHubs();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'لا يمكن حذف الفرع' : 'Could not delete hub'),
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في الاتصال بالخادم' : 'Network error deleting hub',
      });
    }
  };

  const handleOpenEditModal = (hub: Hub) => {
    setEditingHub(hub);
    setEditHubForm({
      phone: hub.phone,
      managerName: hub.managerName,
      operatingHours: hub.operatingHours || '08:00 - 22:00 Daily',
      address: hub.address,
      nameAr: hub.nameAr,
      nameEn: hub.nameEn,
      cityAr: hub.cityAr,
      cityEn: hub.cityEn,
      storageCapacityKg: hub.storageCapacityKg || 2000,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHub) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/hubs/${editingHub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editHubForm,
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: data.message,
        });
        setEditingHub(null);
        await fetchHubs();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'فشل تحديث بيانات الفرع' : 'Failed to update hub'),
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في حفظ بيانات الفرع' : 'Network error updating hub',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCountrySelect = (cCode: string) => {
    setNewHubForm((prev) => ({
      ...prev,
      countryCode: cCode,
    }));
  };

  const handleSaveNewHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubForm.countryCode || !newHubForm.address || !newHubForm.phone) {
      alert(isAr ? 'يرجى ملء كافة الحقول المطلوبة (الدولة، العنوان، ورقم الهاتف)' : 'Please fill all required fields (Country, Address, Phone)');
      return;
    }

    setIsSavingNewHub(true);
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newHubForm,
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: data.message,
        });
        setIsAddModalOpen(false);
        setNewHubForm({
          countryCode: 'JOR',
          address: '',
          phone: '',
          managerName: '',
          operatingHours: '08:00 - 22:00 يومياً',
        });
        await fetchHubs();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'فشل إضافة الفرع' : 'Failed to add hub'),
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في إضافة الفرع' : 'Network error creating hub',
      });
    } finally {
      setIsSavingNewHub(false);
    }
  };

  // Filter Hubs
  const filteredHubs = hubs.filter((hub) => {
    const matchCountry = filterCountry === 'ALL' || hub.countryCode === filterCountry;
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && hub.isActive) ||
      (filterStatus === 'INACTIVE' && !hub.isActive);
    return matchCountry && matchStatus;
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header & Commission Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr
                  ? 'أدوات النظام وإدارة عناوين الفروع الرسمية'
                  : 'Official Physical Hubs & System Address Registry'}
              </h3>
              <p className="text-slate-500 text-xs">
                {isAr
                  ? 'تحكم كامل في شبكة الفروع: إضافة فرع جديد، إيقاف وتشغيل أي فرع، وتعديل أرقام الهواتف والمدير المسؤول وساعات العمل والعناوين المعتمدة.'
                  : 'Full control over physical branches: add hubs, toggle operational status, and modify contact lines, managers, and hours.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchHubs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث الفروع' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة فرع رسمي جديد' : 'Commission New Hub'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">{isAr ? 'الدولة:' : 'Country:'}</span>
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
          >
            <option value="ALL">{isAr ? 'جميع الدول' : 'All Countries'}</option>
            <option value="JOR">{isAr ? '🇯🇴 الأردن' : 'Jordan'}</option>
            <option value="DZA">{isAr ? '🇩🇿 الجزائر' : 'Algeria'}</option>
            <option value="EGY">{isAr ? '🇪🇬 مصر' : 'Egypt'}</option>
            <option value="SAU">{isAr ? '🇸🇦 السعودية' : 'Saudi Arabia'}</option>
            <option value="OMN">{isAr ? '🇴🇲 عُمان' : 'Oman'}</option>
            <option value="ARE">{isAr ? '🇦🇪 الإمارات' : 'UAE'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">{isAr ? 'حالة التشغيل:' : 'Status:'}</span>
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'فروع نشطة' : 'Active'}
            </button>
            <button
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'INACTIVE' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'فروع موقوفة' : 'Inactive'}
            </button>
          </div>
        </div>

        <span className="text-slate-500 text-xs font-medium">
          {isAr ? `إجمالي الفروع المعروضة: (${filteredHubs.length})` : `Total Hubs: (${filteredHubs.length})`}
        </span>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHubs.map((hub) => (
          <div
            key={hub.id}
            className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
              hub.isActive
                ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                : 'bg-slate-50 border-rose-200 opacity-90'
            }`}
          >
            {/* Top Hub Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {hub.countryCode === 'JOR'
                      ? '🇯🇴'
                      : hub.countryCode === 'DZA'
                      ? '🇩🇿'
                      : hub.countryCode === 'EGY'
                      ? '🇪🇬'
                      : hub.countryCode === 'SAU'
                      ? '🇸🇦'
                      : hub.countryCode === 'OMN'
                      ? '🇴🇲'
                      : hub.countryCode === 'ARE'
                      ? '🇦🇪'
                      : '🌍'}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isAr ? hub.nameAr : hub.nameEn}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {isAr ? hub.cityAr : hub.cityEn} • {hub.countryCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                    {hub.code}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    hub.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hub.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {hub.isActive
                    ? isAr
                      ? 'فرع نشط ومتاح للشحن والاستلام'
                      : 'Active & Operating'
                    : isAr
                    ? 'فرع موقوف مؤقتاً عن العمل'
                    : 'Suspended / Inactive'}
                </span>
              </div>

              {/* Physical Street Address Box */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {isAr ? 'العنوان الفعلي المعتمد:' : 'Official Physical Street Address:'}
                </span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed select-all font-medium">
                    {hub.address}
                  </p>
                </div>
              </div>

              {/* Operational Metadata Table */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 bg-slate-50/70 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{isAr ? 'رقم الهاتف' : 'Contact Phone'}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-[11px]" dir="ltr">
                    {hub.phone}
                  </span>
                </div>

                <div className="p-2 bg-slate-50/70 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-500" />
                    <span>{isAr ? 'المدير المسؤول' : 'Hub Manager'}</span>
                  </span>
                  <span className="font-bold text-slate-900 text-[11px] truncate block">
                    {hub.managerName}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-slate-50/70 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{isAr ? 'ساعات العمل:' : 'Hours:'}</span>
                </span>
                <span className="font-bold text-emerald-700 font-mono">
                  {hub.operatingHours || '08:00 - 22:00'}
                </span>
              </div>

              <div className="p-2 bg-slate-50/70 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>{isAr ? 'السعة التخزينية:' : 'Capacity:'}</span>
                </span>
                <span className="font-bold text-brand-600 font-mono">
                  {hub.storageCapacityKg || 2500} كغ
                </span>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleHub(hub.id)}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  hub.isActive
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {hub.isActive
                    ? isAr
                      ? 'إيقاف تشغيل الفرع'
                      : 'Suspend Hub'
                    : isAr
                    ? 'تشغيل وتفعيل الفرع'
                    : 'Activate Hub'}
                </span>
              </button>

              <button
                onClick={() => handleOpenEditModal(hub)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title={isAr ? 'تعديل بيانات الفرع' : 'Edit Hub Details'}
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDeleteHub(hub)}
                className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                title={isAr ? 'حذف الفرع' : 'Delete Hub'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add Official Hub */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isAr ? 'تدشين فرع دولي معتمد جديد' : 'Commission New Official Branch'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {isAr
                      ? 'يكفي إدخال البيانات الخمس الأساسية، وسيتم توقيع وتوليد باقي المعايير تلقائياً'
                      : 'Enter the 5 core attributes; technical metadata is automatically signed & derived'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewHub} className="space-y-4">
              {/* 1. COUNTRY */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-brand-500" />
                  <span>{isAr ? '1. الدولة *' : '1. Country *'}</span>
                </label>
                <select
                  value={newHubForm.countryCode}
                  onChange={(e) => handleCountrySelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                >
                  <option value="JOR">🇯🇴 الأردن (Jordan)</option>
                  <option value="DZA">🇩🇿 الجزائر (Algeria)</option>
                  <option value="EGY">🇪🇬 مصر (Egypt)</option>
                  <option value="SAU">🇸🇦 السعودية (Saudi Arabia)</option>
                  <option value="OMN">🇴🇲 سلطنة عُمان (Oman)</option>
                  <option value="ARE">🇦🇪 الإمارات (UAE)</option>
                  <option value="QAT">🇶🇦 قطر (Qatar)</option>
                  <option value="KWT">🇰🇼 الكويت (Kuwait)</option>
                  <option value="TUN">🇹🇳 تونس (Tunisia)</option>
                  <option value="MAR">🇲🇦 المغرب (Morocco)</option>
                  <option value="TUR">🇹🇷 تركيا (Turkey)</option>
                  <option value="LBN">🇱🇧 لبنان (Lebanon)</option>
                  <option value="IRQ">🇮🇶 العراق (Iraq)</option>
                </select>
              </div>

              {/* 2. DETAILED ADDRESS */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span>{isAr ? '2. العنوان بالتفصيل *' : '2. Detailed Physical Address *'}</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    isAr
                      ? 'مثال: حي حيدرة، شارع الأخوة بوعدو، مجمع الأعمال الدولي رقم 42، الجزائر العاصمة'
                      : 'e.g. Abdali Boulevard, Building 14, Suite 200, Amman, Jordan'
                  }
                  value={newHubForm.address}
                  onChange={(e) => setNewHubForm({ ...newHubForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* 3. PHONE & 4. MANAGER NAME */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-brand-500" />
                    <span>{isAr ? '3. رقم الهاتف *' : '3. Contact Phone *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+962 6 560 9900"
                    value={newHubForm.phone}
                    onChange={(e) => setNewHubForm({ ...newHubForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-brand-500" />
                    <span>{isAr ? '4. اسم المدير المسؤول *' : '4. Branch Manager *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: م. طارق الصعيدي' : 'e.g. Tariq Al-Saedi'}
                    value={newHubForm.managerName}
                    onChange={(e) => setNewHubForm({ ...newHubForm, managerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 5. OPERATING HOURS */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>{isAr ? '5. ساعات العمل الرسمية *' : '5. Operating Hours *'}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="08:00 - 22:00 يومياً"
                  value={newHubForm.operatingHours}
                  onChange={(e) => setNewHubForm({ ...newHubForm, operatingHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>

              {/* AUTO-SIGNING NOTICE BADGE */}
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-emerald-900">
                    {isAr ? 'بروتوكول التوقيع والتوليد التلقائي (Auto-Signed Protocol)' : 'Auto-Signed Technical Metadata'}
                  </span>
                  <p className="text-[11px] text-emerald-700">
                    {isAr
                      ? 'يتم تلقائياً توليد كود الفرع الرسمي، الاسم المعتمد بالعربية والإنجليزية، السعة التخزينية المبدئية (2,500 كغ)، والتفعيل في الشبكة الدولية.'
                      : 'Branch Code, bilingual names, standard storage capacity (2,500 kg), and network activation are automatically signed & generated.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewHub}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all hover:shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSavingNewHub
                      ? isAr
                        ? 'جاري التوقيع والتدشين...'
                        : 'Signing & Commissioning...'
                      : isAr
                      ? 'تدشين وتوقيع الفرع'
                      : 'Commission & Sign Branch'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Branch Details */}
      {editingHub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isAr ? `تعديل بيانات فرع: ${editingHub.nameAr}` : `Edit Hub: ${editingHub.nameEn}`}
                  </h3>
                  <span className="font-mono text-xs text-slate-400">{editingHub.code} • {editingHub.countryCode}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingHub(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isAr ? 'رقم هاتف الفرع *' : 'Hub Phone *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editHubForm.phone}
                    onChange={(e) => setEditHubForm({ ...editHubForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isAr ? 'المدير المسؤول في الفرع *' : 'Responsible Hub Manager *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editHubForm.managerName}
                    onChange={(e) => setEditHubForm({ ...editHubForm, managerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'ساعات العمل الرسمية' : 'Official Operating Hours'}
                </label>
                <input
                  type="text"
                  value={editHubForm.operatingHours}
                  onChange={(e) => setEditHubForm({ ...editHubForm, operatingHours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'العنوان الفعلي المعتمد' : 'Physical Street Address'}
                </label>
                <textarea
                  rows={2}
                  value={editHubForm.address}
                  onChange={(e) => setEditHubForm({ ...editHubForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isAr ? 'السعة التخزينية القصوى (كغ)' : 'Storage Capacity (Kg)'}
                  </label>
                  <input
                    type="number"
                    value={editHubForm.storageCapacityKg}
                    onChange={(e) =>
                      setEditHubForm({ ...editHubForm, storageCapacityKg: Number(e.target.value) || 2000 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isAr ? 'اسم الفرع' : 'Branch Name'}
                  </label>
                  <input
                    type="text"
                    value={editHubForm.nameAr}
                    onChange={(e) => setEditHubForm({ ...editHubForm, nameAr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingHub(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingEdit ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
