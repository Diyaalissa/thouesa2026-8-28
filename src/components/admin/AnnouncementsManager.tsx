import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Save,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { AnnouncementPlacement, AnnouncementStatus, Locale, PublicAnnouncement } from '../../types';

interface AnnouncementsManagerProps {
  locale: Locale;
  announcements: PublicAnnouncement[];
  onSaveAnnouncement: (announcement: PublicAnnouncement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onToggleAnnouncementStatus: (id: string) => void;
  onRefreshGlobalState?: () => void;
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  locale,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onToggleAnnouncementStatus,
  onRefreshGlobalState,
}) => {
  const isAr = locale === 'ar';

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlacement, setFilterPlacement] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<PublicAnnouncement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<PublicAnnouncement>>({
    titleAr: '',
    titleEn: '',
    bodyAr: '',
    bodyEn: '',
    badgeAr: 'تحديث جديد',
    badgeEn: 'New Update',
    placement: 'TOP_BANNER',
    priority: 100,
    status: 'ACTIVE',
    ctaLabelAr: '',
    ctaLabelEn: '',
    ctaTarget: 'SENDER',
    isDismissible: true,
  });

  const filteredAnnouncements = announcements.filter((a) => {
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (filterPlacement !== 'ALL' && a.placement !== filterPlacement) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      id: `ANN-${Date.now()}`,
      titleAr: '',
      titleEn: '',
      bodyAr: '',
      bodyEn: '',
      badgeAr: 'إعلان رسمي',
      badgeEn: 'Announcement',
      placement: 'TOP_BANNER',
      priority: 100,
      status: 'ACTIVE',
      startAt: new Date().toISOString(),
      ctaLabelAr: '',
      ctaLabelEn: '',
      ctaTarget: 'SENDER',
      isDismissible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PublicAnnouncement) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleAr || !formData.titleEn) {
      alert(isAr ? 'يرجى إدخال العنوان بالعربية والإنجليزية' : 'Please enter titles in both languages');
      return;
    }

    const payload: PublicAnnouncement = {
      id: editingItem?.id || formData.id || `ANN-${Date.now()}`,
      titleAr: formData.titleAr || '',
      titleEn: formData.titleEn || '',
      bodyAr: formData.bodyAr || '',
      bodyEn: formData.bodyEn || '',
      badgeAr: formData.badgeAr,
      badgeEn: formData.badgeEn,
      imageUrl: formData.imageUrl,
      ctaLabelAr: formData.ctaLabelAr,
      ctaLabelEn: formData.ctaLabelEn,
      ctaTarget: formData.ctaTarget,
      placement: formData.placement as AnnouncementPlacement || 'TOP_BANNER',
      priority: Number(formData.priority) || 50,
      startAt: formData.startAt || new Date().toISOString(),
      endAt: formData.endAt,
      status: formData.status as AnnouncementStatus || 'ACTIVE',
      isDismissible: formData.isDismissible ?? true,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAnnouncement(payload);
    setIsModalOpen(false);
    onRefreshGlobalState?.();
  };

  const getStatusBadge = (status: AnnouncementStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
            {isAr ? 'نشط ومعروض' : 'Active'}
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
            {isAr ? 'مجدول' : 'Scheduled'}
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-300">
            {isAr ? 'مسودة داخلية' : 'Draft'}
          </span>
        );
      case 'DISABLED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
            {isAr ? 'معطل' : 'Disabled'}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
            {isAr ? 'منتهي' : 'Expired'}
          </span>
        );
      default:
        return null;
    }
  };

  const getPlacementLabel = (placement: AnnouncementPlacement) => {
    switch (placement) {
      case 'TOP_BANNER':
        return isAr ? 'الشريط العلوي (Top Banner)' : 'Top Banner';
      case 'HOME_FEATURED':
        return isAr ? 'البطاقة البارزة في الواجهة (Home Featured)' : 'Home Featured';
      case 'BELOW_SCHEDULE':
        return isAr ? 'أسفل جدول الرحلات (Below Schedule)' : 'Below Schedule';
      default:
        return placement;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'إدارة الإعلانات والتنبيهات العامة للواجهة الرئيسية' : 'Public Announcements & Hero Banners Oversight'}
              </h3>
              <p className="text-slate-500 text-xs">
                {isAr
                  ? 'تحكم مركزي مباشر في الإعلانات، التنبيهات، والبطاقات الترويجية المعروضة على الواجهة العامة (Landing Page).'
                  : 'Manage top banner notifications, featured campaigns, and announcements displayed across the public portal.'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة إعلان جديد' : 'New Announcement'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">{isAr ? 'الحالة:' : 'Status:'}</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden"
          >
            <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="ACTIVE">{isAr ? 'النشطة فقط' : 'Active Only'}</option>
            <option value="SCHEDULED">{isAr ? 'المجدولة' : 'Scheduled'}</option>
            <option value="DRAFT">{isAr ? 'المسودات' : 'Drafts'}</option>
            <option value="DISABLED">{isAr ? 'المعطلة' : 'Disabled'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">{isAr ? 'الموقع:' : 'Placement:'}</span>
          <select
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden"
          >
            <option value="ALL">{isAr ? 'كافة المواقع' : 'All Placements'}</option>
            <option value="TOP_BANNER">{isAr ? 'الشريط العلوي' : 'Top Banner'}</option>
            <option value="HOME_FEATURED">{isAr ? 'البطاقة البارزة' : 'Home Featured'}</option>
            <option value="BELOW_SCHEDULE">{isAr ? 'أسفل جدول الرحلات' : 'Below Schedule'}</option>
          </select>
        </div>

        <div className="ms-auto text-slate-500 font-semibold">
          {filteredAnnouncements.length} {isAr ? 'إعلان مسجل' : 'records found'}
        </div>
      </div>

      {/* Announcements Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-start">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{isAr ? 'المعرف والأولوية' : 'ID & Priority'}</th>
              <th className="p-3 text-start">{isAr ? 'عنوان الإعلان' : 'Title'}</th>
              <th className="p-3 text-start">{isAr ? 'الموقع والمظهر' : 'Placement & Badge'}</th>
              <th className="p-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="p-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredAnnouncements.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3">
                  <div className="font-mono font-bold text-purple-600">{item.id}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {isAr ? 'الأولوية:' : 'Priority:'} {item.priority}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-900">{isAr ? item.titleAr : item.titleEn}</div>
                  <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                    {isAr ? item.bodyAr : item.bodyEn}
                  </div>
                  {item.ctaLabelAr && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-purple-700 font-bold mt-1 bg-purple-50 px-2 py-0.5 rounded-md">
                      <ExternalLink className="w-3 h-3" />
                      <span>{isAr ? item.ctaLabelAr : item.ctaLabelEn} ({item.ctaTarget})</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span className="font-semibold text-slate-700 block">
                    {getPlacementLabel(item.placement)}
                  </span>
                  {item.badgeAr && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                      {isAr ? item.badgeAr : item.badgeEn}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {getStatusBadge(item.status)}
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onToggleAnnouncementStatus(item.id)}
                      title={item.status === 'ACTIVE' ? (isAr ? 'تعطيل الإعلان (أرشفة)' : 'Disable (Archive)') : (isAr ? 'تفعيل الإعلان' : 'Activate')}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title={isAr ? 'تعديل الإعلان' : 'Edit Announcement'}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Megaphone className="w-4 h-4 text-purple-600" />
                <span>{editingItem ? (isAr ? 'تعديل الإعلان' : 'Edit Announcement') : (isAr ? 'إنشاء إعلان جديد' : 'Create New Announcement')}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'العنوان بالعربية' : 'Arabic Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleAr || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'العنوان بالإنجليزية' : 'English Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'النص بالعربية' : 'Arabic Body'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.bodyAr || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bodyAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'النص بالإنجليزية' : 'English Body'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.bodyEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bodyEn: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الموقع في الصفحة' : 'Placement'}
                  </label>
                  <select
                    value={formData.placement || 'TOP_BANNER'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, placement: e.target.value as AnnouncementPlacement }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="TOP_BANNER">{isAr ? 'الشريط العلوي' : 'Top Banner'}</option>
                    <option value="HOME_FEATURED">{isAr ? 'البطاقة البارزة' : 'Home Featured'}</option>
                    <option value="BELOW_SCHEDULE">{isAr ? 'أسفل جدول الرحلات' : 'Below Schedule'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as AnnouncementStatus }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="ACTIVE">{isAr ? 'نشط ومعروض' : 'Active'}</option>
                    <option value="SCHEDULED">{isAr ? 'مجدول' : 'Scheduled'}</option>
                    <option value="DRAFT">{isAr ? 'مسودة' : 'Draft'}</option>
                    <option value="DISABLED">{isAr ? 'معطل' : 'Disabled'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الأولوية (رقم أعلى = يظهر أولاً)' : 'Priority'}
                  </label>
                  <input
                    type="number"
                    value={formData.priority || 50}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'نص زر الإجراء (عربي)' : 'CTA Label (Ar)'}
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLabelAr || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ctaLabelAr: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="مثال: احجز الآن"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'نص زر الإجراء (إنجليزي)' : 'CTA Label (En)'}
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLabelEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ctaLabelEn: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="e.g. Book Now"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'وجهة الزر' : 'CTA Target'}
                  </label>
                  <select
                    value={formData.ctaTarget || 'SENDER'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ctaTarget: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="SENDER">{isAr ? 'بوابة العميل (Sender)' : 'Customer Portal'}</option>
                    <option value="TRAVELER">{isAr ? 'بوابة المسافر (Traveler)' : 'Traveler Portal'}</option>
                    <option value="CALCULATOR">{isAr ? 'حاسبة الشحن (Calculator)' : 'Calculator'}</option>
                    <option value="SCHEDULE">{isAr ? 'جدول الرحلات (Schedule)' : 'Schedule'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ ونشر الإعلان' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
