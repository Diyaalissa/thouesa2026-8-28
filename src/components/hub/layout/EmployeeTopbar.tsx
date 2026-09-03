import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Bell, 
  Globe, 
  User, 
  ChevronDown, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  QrCode,
  Menu,
  Sparkles
} from 'lucide-react';
import { Hub, Locale, User as UserType } from '../../../types';
import { getRoleDisplayName, canSwitchAllHubs } from '../../../lib/employeePermissions';

interface EmployeeTopbarProps {
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  shiftName?: string;
  pendingAlertsCount?: number;
  onToggleLanguage: () => void;
  onOpenQuickSearch?: () => void;
  onQuickSearch?: (query: string) => void;
  onToggleSidebar?: () => void;
  onOpenScanner?: () => void;
  onSelectHub?: (hubId: string) => void;
  allHubs?: Hub[];
}

export const EmployeeTopbar: React.FC<EmployeeTopbarProps> = ({
  currentHub,
  currentUser,
  locale,
  shiftName = 'المناوبة الصباحية',
  pendingAlertsCount = 4,
  onToggleLanguage,
  onOpenQuickSearch,
  onQuickSearch,
  onToggleSidebar,
  onOpenScanner,
  onSelectHub,
  allHubs = [],
}) => {
  const isAr = locale === 'ar';
  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const hubDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hubDropdownRef.current && !hubDropdownRef.current.contains(event.target as Node)) {
        setHubDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = currentUser?.fullName || (currentUser as any)?.name || (isAr ? 'موظف العمليات' : 'Hub Operator');
  const userInitials = (displayName.replace(/[^\w\u0600-\u06FF]/g, '').slice(0, 2) || 'OP').toUpperCase();
  const roleTitle = getRoleDisplayName(currentUser?.role, locale);
  const canSwitchHubs = canSwitchAllHubs(currentUser?.role);
  const accessibleHubs = canSwitchHubs ? (allHubs.length > 0 ? allHubs : [currentHub]) : [currentHub];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    if (onQuickSearch) {
      onQuickSearch(searchInput.trim());
    } else if (onOpenQuickSearch) {
      onOpenQuickSearch();
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
      {/* Left / Start: Navigation toggle, Brand, Hub Selector & Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="h-9 w-9 flex items-center justify-center text-slate-600 hover:text-amber-600 hover:bg-amber-50/80 border border-slate-200/70 hover:border-amber-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            aria-label={isAr ? 'فتح أو طي القائمة الجانبية' : 'Toggle navigation sidebar'}
            title={isAr ? 'القائمة التشغيلية' : 'Operations Menu'}
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Brand Mark */}
        <div className="flex items-center gap-2">
          <div className="w-8.5 h-8.5 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white font-black text-base flex items-center justify-center shadow-xs select-none">
            ث
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-slate-900 text-xs tracking-wider">THOUESA</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase">
                OPS
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              {isAr ? 'بوابة إدارة الفروع' : 'Hub Operations'}
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden md:block" />

        {/* Hub Selector / Operational Indicator */}
        <div className="relative" ref={hubDropdownRef}>
          <button
            type="button"
            onClick={() => setHubDropdownOpen(!hubDropdownOpen)}
            className="h-9 flex items-center gap-2 px-2.5 sm:px-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer text-start shadow-2xs"
            title={isAr ? 'الفرع التشغيلي الحالي' : 'Current Operational Hub'}
          >
            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-800 max-w-[110px] sm:max-w-[160px] truncate">
                {isAr ? currentHub.nameAr : currentHub.nameEn}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-semibold">
                {currentHub.code}
              </span>
            </div>

            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md font-semibold ms-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'مفتوح' : 'Active'}</span>
            </span>

            {accessibleHubs.length > 1 && (
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ms-0.5 transition-transform duration-200 ${hubDropdownOpen ? 'rotate-180 text-amber-600' : ''}`} />
            )}
          </button>

          {/* Hub Switcher Dropdown */}
          {hubDropdownOpen && accessibleHubs.length > 1 && (
            <div className="absolute top-full start-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                {isAr ? 'التبديل بين الفروع المعتمدة' : 'Switch Operational Hub'}
              </div>
              <div className="space-y-1 mt-1 max-h-64 overflow-y-auto">
                {accessibleHubs.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => {
                      if (onSelectHub) onSelectHub(hub.id);
                      setHubDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-start ${
                      hub.id === currentHub.id ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/80' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{isAr ? hub.nameAr : hub.nameEn}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {hub.code} • {isAr ? (hub.countryNameAr || hub.cityAr) : (hub.countryNameEn || hub.cityEn)}
                      </div>
                    </div>
                    {hub.id === currentHub.id && <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shift Badge */}
        <div className="hidden xl:flex items-center gap-1.5 h-9 px-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-medium text-slate-700">{shiftName}</span>
        </div>
      </div>

      {/* Right / End: Search, Scanner, Alerts, Language, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Global Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <input
            type="text"
            placeholder={isAr ? 'بحث سريع (شحنة، كود، عميل)...' : 'Quick search...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 ps-8 pe-3 py-1.5 bg-slate-50/80 hover:bg-slate-100/90 focus:bg-white focus:ring-2 focus:ring-amber-500/30 rounded-xl text-xs text-slate-800 border border-slate-200/80 focus:border-amber-400 transition-all w-44 lg:w-60 xl:w-72"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
        </form>

        {/* Mobile Search Icon Trigger */}
        <button
          type="button"
          onClick={() => {
            if (onOpenQuickSearch) onOpenQuickSearch();
          }}
          className="md:hidden h-9 w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70 rounded-xl transition-colors cursor-pointer"
          title={isAr ? 'بحث سريع' : 'Quick search'}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Scanner Shortcut Button */}
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="h-9 flex items-center gap-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-98"
            title={isAr ? 'مسح باركود أو QR' : 'Scan Barcode / QR'}
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'مسح ضوئي' : 'Scan'}</span>
          </button>
        )}

        {/* Notification Alerts Bell */}
        <div className="relative">
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70 rounded-xl transition-colors cursor-pointer relative"
            title={isAr ? 'التنبيهات التشغيلية' : 'Operational Notifications'}
          >
            <Bell className="w-4 h-4" />
            {pendingAlertsCount > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Language Toggle */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className="h-9 flex items-center gap-1.5 px-2.5 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
          title={isAr ? 'تبديل اللغة' : 'Switch Language'}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="leading-none">{locale.toUpperCase()}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Employee Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="h-9 flex items-center gap-2 p-1 pe-2 sm:pe-2.5 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-500/20 to-amber-600/20 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-300/60 shrink-0">
              {userInitials}
            </div>
            <div className="hidden sm:flex flex-col text-start leading-none justify-center">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{displayName}</span>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 truncate max-w-[110px]">
                {roleTitle}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-amber-600' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full end-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-bold text-xs text-slate-900">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser?.email || 'operator@thouesa.com'}</div>
                <div className="mt-1.5 text-[10px] inline-block font-mono bg-amber-50 border border-amber-200/60 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  {currentUser?.id || 'EMP-ACTIVE'}
                </div>
              </div>

              <div className="space-y-0.5 text-xs text-slate-700 py-1">
                <div className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{isAr ? 'الفرع المخصص:' : 'Hub:'}</span>
                  <span className="font-bold text-slate-800 font-mono">{currentHub.code}</span>
                </div>
                <div className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{isAr ? 'الدولة:' : 'Country:'}</span>
                  <span className="font-semibold text-slate-800">
                    {isAr ? (currentHub.countryNameAr || currentHub.cityAr) : (currentHub.countryNameEn || currentHub.cityEn)}
                  </span>
                </div>
                <div className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{isAr ? 'الدور الوظيفي:' : 'Role:'}</span>
                  <span className="font-semibold text-amber-700">{roleTitle}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

