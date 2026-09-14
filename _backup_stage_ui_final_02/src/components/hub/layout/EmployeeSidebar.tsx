import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PackagePlus,
  ScanSearch,
  PackageCheck,
  BadgeCheck,
  Plane,
  GitCompareArrows,
  ClipboardList,
  Handshake,
  PackageOpen,
  Boxes,
  Tags,
  ArrowRightLeft,
  History,
  CircleDollarSign,
  WalletCards,
  ReceiptText,
  TriangleAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Building2,
  Shield,
  ShieldCheck,
  User,
  Key,
  LogOut,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Lock,
  Calendar,
  Layers,
} from 'lucide-react';
import { EmployeeNavSection, Locale, UserRole, Hub, User as UserType } from '../../../types';
import { canAccessSection, getRoleConfig, getRoleDisplayName } from '../../../lib/employeePermissions';

export interface EmployeeSidebarBadgeCounts {
  intake?: number;
  inspection?: number;
  readyForTransport?: number;
  tripsPending?: number;
  destinationIntake?: number;
  readyForDelivery?: number;
  pendingPayouts?: number;
  incidents?: number;
}

export interface EmployeeSidebarProps {
  activeSection: EmployeeNavSection;
  onSelectSection: (section: EmployeeNavSection) => void;
  locale: Locale;
  currentUser?: UserType;
  currentHub?: Hub;
  currentUserRole?: UserRole | string;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  badgeCounts?: EmployeeSidebarBadgeCounts;
  onLogout?: () => void;
}

interface NavItemDef {
  id: EmployeeNavSection;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

interface NavGroupDef {
  key: string;
  titleAr: string;
  titleEn: string;
  collapsible: boolean;
  items: NavItemDef[];
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  activeSection,
  onSelectSection,
  locale,
  currentUser,
  currentHub,
  currentUserRole,
  isOpen = false,
  onClose,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
  isMobileOpen: controlledMobileOpen,
  onCloseMobile: controlledCloseMobile,
  badgeCounts: rawBadgeCounts,
  onLogout,
}) => {
  const badgeCounts: EmployeeSidebarBadgeCounts = rawBadgeCounts || {};
  const isAr = locale === 'ar';
  const role = currentUserRole || currentUser?.role || 'HUB_AGENT';

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const onToggleCollapse = controlledToggleCollapse || (() => setInternalCollapsed((prev) => !prev));
  const isMobile = controlledMobileOpen !== undefined ? controlledMobileOpen : isOpen;
  const handleCloseMobile = controlledCloseMobile || onClose || (() => {});

  // Collapsible Groups state with localStorage persistence
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('thouesa_hub_sidebar_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      try {
        localStorage.setItem('thouesa_hub_sidebar_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Employee Account Modal state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTab, setAccountTab] = useState<'profile' | 'hub' | 'permissions' | 'password'>('profile');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Structured Nav Groups strictly following Operational Workflow Priority
  const navGroups: NavGroupDef[] = [
    {
      key: 'home',
      titleAr: 'الرئيسية',
      titleEn: 'Home',
      collapsible: false,
      items: [
        {
          id: 'OPERATIONS_DASHBOARD',
          labelAr: 'لوحة العمليات',
          labelEn: 'Operations Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      key: 'shipments',
      titleAr: 'الطرود',
      titleEn: 'Shipments',
      collapsible: true,
      items: [
        {
          id: 'ORIGIN_INTAKE',
          labelAr: 'استقبال الطرود',
          labelEn: 'Shipment Intake',
          icon: PackagePlus,
          badge: badgeCounts.intake,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'INSPECTION_WEIGHT',
          labelAr: 'الفحص والوزن',
          labelEn: 'Inspection & Weight',
          icon: ScanSearch,
          badge: badgeCounts.inspection,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'READY_FOR_TRANSPORT',
          labelAr: 'جاهزة للنقل',
          labelEn: 'Ready for Transport',
          icon: PackageCheck,
          badge: badgeCounts.readyForTransport,
          badgeColor: 'bg-emerald-600 text-white',
        },
      ],
    },
    {
      key: 'travelers',
      titleAr: 'المسافرون',
      titleEn: 'Travelers',
      collapsible: true,
      items: [
        {
          id: 'TRIP_VERIFICATION',
          labelAr: 'التحقق من الرحلات',
          labelEn: 'Trip Verification',
          icon: BadgeCheck,
          badge: badgeCounts.tripsPending,
          badgeColor: 'bg-sky-500 text-white',
        },
        {
          id: 'VERIFIED_TRIPS',
          labelAr: 'الرحلات المعتمدة',
          labelEn: 'Verified Trips',
          icon: Plane,
        },
      ],
    },
    {
      key: 'transport',
      titleAr: 'النقل',
      titleEn: 'Transport Operations',
      collapsible: true,
      items: [
        {
          id: 'MATCHING',
          labelAr: 'المطابقة',
          labelEn: 'Matching',
          icon: GitCompareArrows,
        },
        {
          id: 'MANIFESTS',
          labelAr: 'المانيفست',
          labelEn: 'Manifests',
          icon: ClipboardList,
        },
        {
          id: 'TRAVELER_HANDOVER',
          labelAr: 'تسليم للمسافر',
          labelEn: 'Traveler Handover',
          icon: Handshake,
        },
        {
          id: 'DESTINATION_INTAKE',
          labelAr: 'استقبال الوصول',
          labelEn: 'Destination Intake',
          icon: PackageOpen,
          badge: badgeCounts.destinationIntake,
          badgeColor: 'bg-blue-600 text-white',
        },
      ],
    },
    {
      key: 'delivery',
      titleAr: 'التسليم',
      titleEn: 'Delivery',
      collapsible: true,
      items: [
        {
          id: 'PICKUP_PREPARATION',
          labelAr: 'تجهيز للاستلام',
          labelEn: 'Pickup Preparation',
          icon: Boxes,
        },
        {
          id: 'FINAL_DELIVERY',
          labelAr: 'التسليم النهائي',
          labelEn: 'Final Delivery',
          icon: PackageCheck,
          badge: badgeCounts.readyForDelivery,
          badgeColor: 'bg-emerald-600 text-white',
        },
      ],
    },
    {
      key: 'pricing',
      titleAr: 'التسعير',
      titleEn: 'Pricing',
      collapsible: true,
      items: [
        {
          id: 'SHIPPING_RATES',
          labelAr: 'أسعار الشحن',
          labelEn: 'Shipping Rates',
          icon: Tags,
        },
        {
          id: 'EXCHANGE_RATES',
          labelAr: 'أسعار الصرف',
          labelEn: 'Exchange Rates',
          icon: ArrowRightLeft,
        },
        {
          id: 'RATE_HISTORY',
          labelAr: 'سجل الأسعار',
          labelEn: 'Rate History',
          icon: History,
        },
      ],
    },
    {
      key: 'settlements',
      titleAr: 'التسويات المالية',
      titleEn: 'Settlements',
      collapsible: true,
      items: [
        {
          id: 'CUSTOMER_PAYMENTS',
          labelAr: 'تحصيل العملاء',
          labelEn: 'Customer Collections',
          icon: CircleDollarSign,
        },
        {
          id: 'TRAVELER_SETTLEMENTS',
          labelAr: 'مستحقات المسافرين',
          labelEn: 'Traveler Payouts',
          icon: WalletCards,
          badge: badgeCounts.pendingPayouts,
          badgeColor: 'bg-amber-600 text-white',
        },
        {
          id: 'SETTLEMENT_HISTORY',
          labelAr: 'سجل التسويات',
          labelEn: 'Settlement History',
          icon: ReceiptText,
        },
      ],
    },
    {
      key: 'exceptions',
      titleAr: 'الاستثناءات',
      titleEn: 'Exceptions',
      collapsible: true,
      items: [
        {
          id: 'OPERATIONAL_INCIDENTS',
          labelAr: 'الحالات التشغيلية',
          labelEn: 'Operational Incidents',
          icon: TriangleAlert,
          badge: badgeCounts.incidents,
          badgeColor: 'bg-rose-600 text-white',
        },
      ],
    },
    {
      key: 'search',
      titleAr: 'البحث',
      titleEn: 'Search',
      collapsible: false,
      items: [
        {
          id: 'GLOBAL_SEARCH',
          labelAr: 'البحث الشامل',
          labelEn: 'Global Search',
          icon: Search,
        },
      ],
    },
  ];

  // Dynamic filtering based on role permissions
  const filteredNavGroups = navGroups
    .map((group) => {
      const allowedItems = group.items.filter((item) => canAccessSection(role, item.id));
      return {
        ...group,
        items: allowedItems,
      };
    })
    .filter((group) => group.items.length > 0);

  // Auto-expand group if active section is inside it
  useEffect(() => {
    filteredNavGroups.forEach((group) => {
      const containsActive = group.items.some((i) => i.id === activeSection);
      if (containsActive && collapsedGroups[group.key]) {
        setCollapsedGroups((prev) => ({ ...prev, [group.key]: false }));
      }
    });
  }, [activeSection]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) return;
    setPasswordChangeSuccess(true);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setTimeout(() => {
      setPasswordChangeSuccess(false);
    }, 3000);
  };

  const roleConfig = getRoleConfig(role);
  const roleDisplayName = getRoleDisplayName(role, locale);

  const hubName = isAr ? (currentHub?.nameAr || 'فرع عمّان الرئيسي') : (currentHub?.nameEn || 'Amman Main Hub');
  const hubCountry = isAr ? (currentHub?.countryNameAr || 'المملكة الأردنية الهاشمية') : (currentHub?.countryNameEn || 'Jordan');

  const renderSidebarContent = (isCollapsedMode: boolean, isMobileDrawer: boolean) => (
    <>
      {/* Integrated Sidebar Header with Embedded Toggle Button & Top Action Slot */}
      <div
        className={`w-full h-16 px-3 border-b border-slate-100 flex items-center ${
          isCollapsedMode ? 'justify-center' : 'justify-between'
        } bg-white shrink-0 transition-all duration-300`}
      >
        {!isCollapsedMode && (
          <div className="flex items-center gap-2 min-w-0 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-xs shrink-0">
              TH
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-slate-800 truncate whitespace-nowrap leading-none">
                {isAr ? 'القائمة التشغيلية' : 'Operations Nav'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                THOUESA HUB
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center shrink-0">
          {/* Element slot in sidebar header */}
          <div
            id="sidebar-header-top-element"
            className="flex items-center justify-center animate-in fade-in duration-150"
          >
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs select-none"
              title={isAr ? 'الفرع التشغيلي متصل' : 'Hub Online'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-semibold leading-none">{isAr ? 'متصل' : 'LIVE'}</span>
            </span>
          </div>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={handleCloseMobile}
              className="p-1.5 ms-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
              aria-label="Close Mobile Sidebar"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Navigation Items */}
      <nav
        aria-label="Operational Navigation"
        className="w-full flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-3.5 scrollbar-thin transition-all duration-300"
      >
        {filteredNavGroups.map((group) => {
          const isGroupCollapsed = !isCollapsedMode && group.collapsible && !!collapsedGroups[group.key];

          return (
            <div key={group.key} className="space-y-1">
              {/* Group Title Header */}
              {!isCollapsedMode ? (
                group.collapsible ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider transition-colors group/header cursor-pointer"
                  >
                    <span className="truncate whitespace-nowrap">
                      {isAr ? group.titleAr : group.titleEn}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover/header:text-slate-600 shrink-0 ${
                        isGroupCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>
                ) : (
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate whitespace-nowrap">
                    {isAr ? group.titleAr : group.titleEn}
                  </div>
                )
              ) : (
                <div className="my-1 border-t border-slate-100 mx-2" />
              )}

              {/* Items Container */}
              {(!isGroupCollapsed || isCollapsedMode) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    const hasBadge = item.badge !== undefined && item.badge > 0;

                    return (
                      <div key={item.id} className="relative group/item">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSection(item.id);
                            if (isMobileDrawer) handleCloseMobile();
                          }}
                          className={`w-full flex items-center ${
                            isCollapsedMode ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                          } rounded-xl text-xs font-semibold transition-all cursor-pointer text-start relative ${
                            isActive
                              ? 'bg-amber-500 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                          title={isCollapsedMode ? (isAr ? item.labelAr : item.labelEn) : undefined}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-white' : 'text-slate-500 group-hover/item:text-slate-900'
                              }`}
                            />
                            {!isCollapsedMode && (
                              <span className="truncate whitespace-nowrap">
                                {isAr ? item.labelAr : item.labelEn}
                              </span>
                            )}
                          </div>

                          {/* Smart Navigation Badge (Hidden if value is 0) */}
                          {hasBadge && (
                            isCollapsedMode ? (
                              <span
                                className={`absolute top-1 end-1 min-w-[16px] h-4 px-1 rounded-full ${
                                  item.badgeColor || 'bg-amber-500 text-white'
                                } text-[9px] font-bold flex items-center justify-center shadow-xs leading-none`}
                              >
                                {item.badge}
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 whitespace-nowrap ${
                                  isActive
                                    ? 'bg-black/20 text-white'
                                    : item.badgeColor || 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )
                          )}
                        </button>

                        {/* Hover Tooltip in Collapsed Icon Mode */}
                        {isCollapsedMode && (
                          <div className="hidden md:group-hover/item:flex absolute start-full top-1/2 -translate-y-1/2 ms-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl z-50 whitespace-nowrap items-center pointer-events-none animate-in fade-in duration-150">
                            <span>{isAr ? item.labelAr : item.labelEn}</span>
                            {hasBadge && (
                              <span className={`ms-2 px-1.5 py-0.2 rounded text-[10px] font-bold ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Tenth: Sticky Footer Section (Current Hub & Employee Account) */}
      <div className="mt-auto border-t border-slate-200 bg-slate-50/90 shrink-0 p-2.5 space-y-2">
        {/* Current Hub Card */}
        {!isCollapsedMode ? (
          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {hubName}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? 'نشط' : 'OPEN'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
              <span className="truncate">{hubCountry}</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                {isAr ? 'مناوبة صباحية' : 'Morning Shift'}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="relative group flex justify-center py-1 cursor-pointer"
            title={`${hubName} - ${hubCountry} (OPEN)`}
            onClick={() => setShowAccountModal(true)}
          >
            <div className="relative p-2 rounded-xl bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 transition-colors">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </div>
            {/* Tooltip for Hub in Icon Mode */}
            <div className="hidden md:group-hover:flex absolute start-full top-1/2 -translate-y-1/2 ms-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl z-50 whitespace-nowrap flex-col pointer-events-none animate-in fade-in duration-150">
              <span className="font-bold">{hubName}</span>
              <span className="text-[10px] text-slate-300">{hubCountry} • {isAr ? 'نشط (صباحي)' : 'OPEN (Morning)'}</span>
            </div>
          </div>
        )}

        {/* Employee Account Interactive Card */}
        {!isCollapsedMode ? (
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-xs transition-all text-start cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-amber-100">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'AK'
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                  {currentUser?.fullName || (isAr ? 'أحمد خليل' : 'Ahmad Khalil')}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 truncate">
                  {roleDisplayName}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0 rtl:rotate-180" />
          </button>
        ) : (
          <div
            className="relative group flex justify-center cursor-pointer"
            onClick={() => setShowAccountModal(true)}
          >
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-amber-200 hover:ring-amber-400 transition-all cursor-pointer"
              aria-label="Employee Profile"
            >
              {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'AK'}
            </button>
            {/* Tooltip for Employee in Icon Mode */}
            <div className="hidden md:group-hover:flex absolute start-full top-1/2 -translate-y-1/2 ms-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl z-50 whitespace-nowrap flex-col pointer-events-none animate-in fade-in duration-150">
              <span className="font-bold">{currentUser?.fullName || 'Ahmad Khalil'}</span>
              <span className="text-[10px] text-amber-300">{roleDisplayName}</span>
            </div>
          </div>
        )}

        {/* Desktop Collapse Toggle Footer Button */}
        {!isMobileDrawer && (
          <div className="hidden md:block pt-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer text-xs font-bold gap-2 whitespace-nowrap"
            >
              {isCollapsedMode ? (
                isAr ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  {isAr ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
                  <span className="truncate whitespace-nowrap">{isAr ? 'تصغير القائمة' : 'Collapse Menu'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (ALWAYS in flex layout on md+ screens, never hidden by translation/opacity) */}
      <aside
        id="hub-employee-sidebar"
        className={`hidden md:flex flex-col shrink-0 bg-white border-e border-slate-200 shadow-2xs select-none sticky top-16 h-[calc(100vh-4rem)] z-20 transition-[width] duration-300 ease-in-out ${
          isCollapsed
            ? 'w-20 min-w-[5rem] max-w-[5rem]'
            : 'w-64 min-w-[16rem] max-w-[16rem]'
        }`}
      >
        {renderSidebarContent(isCollapsed, false)}
      </aside>

      {/* Mobile Drawer (visible on mobile viewports < md when toggled open) */}
      {isMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={handleCloseMobile}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            aria-label={isAr ? 'إغلاق القائمة' : 'Close navigation'}
          />
          {/* Mobile Drawer Aside */}
          <aside
            id="hub-employee-sidebar-mobile"
            className="relative z-10 w-72 max-w-[85vw] bg-white border-e border-slate-200 shadow-2xl flex flex-col h-full select-none"
          >
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Employee Account & Hub Details Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white/20">
                  {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'AK'}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {currentUser?.fullName || (isAr ? 'أحمد خليل' : 'Ahmad Khalil')}
                  </h3>
                  <p className="text-xs text-amber-300 font-medium">
                    {roleDisplayName} • {hubName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setAccountTab('profile')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  accountTab === 'profile'
                    ? 'border-amber-500 text-amber-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {isAr ? 'الملف الشخصي' : 'Profile'}
              </button>
              <button
                type="button"
                onClick={() => setAccountTab('hub')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  accountTab === 'hub'
                    ? 'border-amber-500 text-amber-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                {isAr ? 'بيانات الفرع' : 'Hub Details'}
              </button>
              <button
                type="button"
                onClick={() => setAccountTab('permissions')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  accountTab === 'permissions'
                    ? 'border-amber-500 text-amber-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'صلاحياتي' : 'Permissions'}
              </button>
              <button
                type="button"
                onClick={() => setAccountTab('password')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  accountTab === 'password'
                    ? 'border-amber-500 text-amber-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                {isAr ? 'كلمة المرور' : 'Password'}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Profile Tab */}
              {accountTab === 'profile' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isAr ? 'كود الموظف' : 'Staff ID'}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentUser?.staffCode || 'STF-AMM-0042'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isAr ? 'الدور الوظيفي' : 'Assigned Role'}
                      </span>
                      <span className="font-bold text-amber-600">
                        {roleDisplayName}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isAr ? 'البريد الإلكتروني' : 'Email'}
                      </span>
                      <span className="font-medium text-slate-800 break-all">
                        {currentUser?.email || 'staff.amman@thouesa.com'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isAr ? 'رقم الهاتف' : 'Phone'}
                      </span>
                      <span className="font-medium text-slate-800 dir-ltr">
                        {currentUser?.phone || '+962 7 9000 0000'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-700 space-y-1">
                    <span className="font-bold text-amber-900 block">
                      {isAr ? 'نطاق العمليات المصرح' : 'Authorized Operational Scope'}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isAr
                        ? roleConfig.descriptionAr
                        : roleConfig.descriptionEn}
                    </p>
                  </div>
                </div>
              )}

              {/* Hub Details Tab */}
              {accountTab === 'hub' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{hubName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {isAr ? 'مفتوح للعمليات' : 'Open for Operations'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{currentHub?.address || (isAr ? 'مطار الملكة علياء الدولي / المنطقة اللوجستية' : 'Queen Alia Intl Airport, Cargo Village')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{currentHub?.operatingHours || (isAr ? 'يومياً: 08:00 ص - 09:00 م' : 'Daily: 08:00 - 21:00')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="dir-ltr">{currentHub?.phone || '+962 6 500 0000'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isAr ? 'سعة التخزين الإجمالية' : 'Total Storage'}
                      </span>
                      <span className="font-bold text-slate-800">
                        {currentHub?.storageCapacityKg || 1500} كغم
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isAr ? 'المستخدم حالياً' : 'Current Utilized'}
                      </span>
                      <span className="font-bold text-amber-600">
                        {currentHub?.currentUsedKg || 380} كغم
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions Tab */}
              {accountTab === 'permissions' && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'مصفوفة الصلاحيات المعتمدة' : 'Verified Capabilities'}
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {[
                        {
                          labelAr: 'استلام وفحص الطرود ووزنها الدقيق',
                          labelEn: 'Shipment Intake & Precision Weigh-in',
                          active: true,
                        },
                        {
                          labelAr: 'اعتماد وتعديل فروقات الوزن',
                          labelEn: 'Weight Adjustment Approval',
                          active: roleConfig.canApproveWeightAdjustment,
                        },
                        {
                          labelAr: 'تحصيل مدفوعات العملاء وإصدار الإيصالات',
                          labelEn: 'Customer Collections & Receipts',
                          active: roleConfig.canCollectPayment,
                        },
                        {
                          labelAr: 'صرف مستحقات وأرباح المسافرين المعتمدين',
                          labelEn: 'Traveler Payouts Disbursement',
                          active: roleConfig.canDisbursePayout,
                        },
                        {
                          labelAr: 'نشر وتعديل أسعار الصرف اليومية (Buy/Sell)',
                          labelEn: 'Daily FX Buy/Sell Rate Administration',
                          active: roleConfig.canEditFX,
                        },
                        {
                          labelAr: 'إدارة وتعديل تعرفة الشحن الرسمية',
                          labelEn: 'Shipping Rates Administration',
                          active: roleConfig.canEditShippingRates,
                        },
                        {
                          labelAr: 'تصعيد الحالات التشغيلية والنزاعات',
                          labelEn: 'Incident Escalation & Overrides',
                          active: roleConfig.canEscalateIncident,
                        },
                        {
                          labelAr: 'التبديل بين فروع الدول (الإدارة المركزية)',
                          labelEn: 'Multi-Hub Access & Switching',
                          active: roleConfig.canSwitchAllHubs,
                        },
                      ].map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100"
                        >
                          <span className="text-xs text-slate-700 font-medium">
                            {isAr ? p.labelAr : p.labelEn}
                          </span>
                          {p.active ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              {isAr ? 'مفوّض' : 'Granted'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                              {isAr ? 'غير مصرح' : 'Restricted'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {accountTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  {passwordChangeSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!'}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isAr ? 'حفظ كلمة المرور الجديدة' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>

            {/* Modal Footer with Logout */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAccountModal(false);
                  if (onLogout) onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isAr ? 'تسجيل الخروج' : 'Logout'}
              </button>

              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
