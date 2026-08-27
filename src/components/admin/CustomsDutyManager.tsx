import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Percent,
  RefreshCw,
  RotateCcw,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Sliders,
  DollarSign,
  Globe2,
  FileText,
  BadgePercent,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { CustomsDutyRule, ItemCategory, ItemCondition, Locale } from '../../types';
import { DEFAULT_CUSTOMS_RULES } from '../../lib/constants';
import { calculateCustomsDuty, formatCurrency } from '../../lib/crypto';

interface CustomsDutyManagerProps {
  locale: Locale;
  onRefreshGlobalState?: () => void;
}

export const CustomsDutyManager: React.FC<CustomsDutyManagerProps> = ({
  locale,
  onRefreshGlobalState,
}) => {
  const isAr = locale === 'ar';
  const [rules, setRules] = useState<CustomsDutyRule[]>(DEFAULT_CUSTOMS_RULES);
  const [draftRules, setDraftRules] = useState<Record<string, CustomsDutyRule>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // New Country Modal/Form State
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryNameAr, setNewCountryNameAr] = useState('');
  const [newCountryNameEn, setNewCountryNameEn] = useState('');
  const [newStandardDuty, setNewStandardDuty] = useState('15');
  const [newPersonalDuty, setNewPersonalDuty] = useState('10');
  const [newCommercialDuty, setNewCommercialDuty] = useState('20');
  const [newUsedExempt, setNewUsedExempt] = useState(true);
  const [newNotesAr, setNewNotesAr] = useState('');

  // Live Customs Calculator Simulator State
  const [simCountry, setSimCountry] = useState('DZA');
  const [simCondition, setSimCondition] = useState<ItemCondition>('NEW_PERSONAL');
  const [simDeclaredVal, setSimDeclaredVal] = useState<number>(250);
  const [simCategory, setSimCategory] = useState<ItemCategory>('ELECTRONICS');

  const fetchCustomsRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rates/customs');
      const data = await res.json();
      if (data.success && data.rules) {
        setRules(data.rules);
        const drafts: Record<string, CustomsDutyRule> = {};
        data.rules.forEach((r: CustomsDutyRule) => {
          drafts[r.countryCode] = { ...r };
        });
        setDraftRules(drafts);
      }
    } catch (err) {
      console.error('Error fetching customs rules:', err);
      // Fallback to local default rules
      const drafts: Record<string, CustomsDutyRule> = {};
      DEFAULT_CUSTOMS_RULES.forEach((r) => {
        drafts[r.countryCode] = { ...r };
      });
      setRules(DEFAULT_CUSTOMS_RULES);
      setDraftRules(drafts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomsRules();
  }, []);

  const handleFieldChange = (countryCode: string, field: keyof CustomsDutyRule, value: any) => {
    setDraftRules((prev) => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        [field]: value,
      },
    }));
  };

  const handleSaveSingleRule = async (countryCode: string) => {
    const draft = draftRules[countryCode];
    if (!draft) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/rates/customs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: draft.countryCode,
          countryNameAr: draft.countryNameAr,
          countryNameEn: draft.countryNameEn,
          standardDutyPercent: draft.standardDutyPercent,
          newPersonalGoodsDutyPercent: draft.newPersonalGoodsDutyPercent,
          commercialNewDutyPercent: draft.commercialNewDutyPercent,
          usedPersonalExempt: draft.usedPersonalExempt,
          minExemptValueUsd: draft.minExemptValueUsd,
          notesAr: draft.notesAr,
          notesEn: draft.notesEn,
          adminName: 'Master Admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: isAr
            ? `تم تحديث التعريفة الجمركية لدولة ${draft.countryNameAr} (${countryCode}) بنجاح`
            : `Customs duty updated for ${draft.countryNameEn} (${countryCode})`,
        });
        fetchCustomsRules();
        if (onRefreshGlobalState) onRefreshGlobalState();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'فشل حفظ التعريفة' : 'Failed to save rule'),
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || (isAr ? 'خطأ في الاتصال بالسيرفر' : 'Network error'),
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedbackMessage(null), 4500);
    }
  };

  const handleResetBaseline = async () => {
    if (
      !window.confirm(
        isAr
          ? 'هل أنت متأكد من إعادة تعيين جميع نسب الجمارك إلى المعايير القانونية الافتراضية؟'
          : 'Are you sure you want to reset all customs rules to baseline values?'
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/rates/customs/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: 'Master Admin' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: isAr
            ? 'تمت استعادة التعريفات الجمركية القانونية لكافة الدول'
            : 'Customs rules successfully restored to baseline',
        });
        fetchCustomsRules();
        if (onRefreshGlobalState) onRefreshGlobalState();
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Error resetting rules',
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleAddNewCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryCode || !newCountryNameAr) {
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'يرجى إدخال رمز الدولة واسمها' : 'Please enter country code and name',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/rates/customs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: newCountryCode.toUpperCase().trim(),
          countryNameAr: newCountryNameAr,
          countryNameEn: newCountryNameEn || newCountryNameAr,
          standardDutyPercent: parseFloat(newStandardDuty) || 15,
          newPersonalGoodsDutyPercent: parseFloat(newPersonalDuty) || 10,
          commercialNewDutyPercent: parseFloat(newCommercialDuty) || 20,
          usedPersonalExempt: newUsedExempt,
          notesAr: newNotesAr,
          adminName: 'Master Admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: isAr
            ? `تمت إضافة الدولة (${newCountryCode.toUpperCase()}) والتعريفة الجمركية بنجاح`
            : `Added country customs tariff for (${newCountryCode.toUpperCase()})`,
        });
        setShowAddCountry(false);
        setNewCountryCode('');
        setNewCountryNameAr('');
        setNewCountryNameEn('');
        setNewNotesAr('');
        fetchCustomsRules();
        if (onRefreshGlobalState) onRefreshGlobalState();
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Error adding country',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Run calculation for simulator
  const activeDraftRule = draftRules[simCountry] || {
    standardDutyPercent: 15,
    newPersonalGoodsDutyPercent: 12,
    commercialNewDutyPercent: 20,
  };

  const simResult = calculateCustomsDuty({
    destinationCountry: simCountry,
    declaredValueUsd: simDeclaredVal,
    itemCondition: simCondition,
    category: simCategory,
    customRatePercent:
      simCondition === 'USED_PERSONAL'
        ? 0
        : simCondition === 'NEW_PERSONAL'
        ? activeDraftRule.newPersonalGoodsDutyPercent
        : activeDraftRule.commercialNewDutyPercent,
  });

  return (
    <div className="space-y-6" id="customs-duty-manager-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                <BadgePercent className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {isAr ? 'التعريفات الجمركية ونسب الدول' : 'Customs Tariffs & Country Duty Rules'}
              </h2>
            </div>
            <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              {isAr
                ? 'إدارة شاملة لنسب الجمارك حسب الدولة وحالة البضاعة (أمانات شخصية مستعملة معفاة 0%، بضائع شخصية جديدة، بضائع تجارية جديدة). يُطبق تلقائياً على حساب التكاليف والبوليصة.'
                : 'Manage customs duty rates by country and item condition (used personal items 0% exempt, new personal items, commercial goods).'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddCountry(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة دولة / نسبة جديدة' : 'Add Country Duty'}</span>
            </button>
            <button
              onClick={handleResetBaseline}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-emerald-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title={isAr ? 'استعادة النسب الافتراضية' : 'Reset to Baseline'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'استعادة الافتراضي' : 'Reset Baseline'}</span>
            </button>
            <button
              onClick={fetchCustomsRules}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title={isAr ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Rules Notice Badge */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 leading-relaxed">
          <p className="font-bold">
            {isAr ? 'القاعدة القانونية للأمانات الشخصية المستعملة:' : 'Legal Exemption Rule for Used Personal Effects:'}
          </p>
          <p className="text-amber-800">
            {isAr
              ? 'وفقاً للوائح الجمركية الدولية، الأمانات والمقتنيات الشخصية المستعملة (Used Personal) معفاة تماماً بنسبة (0%) ولا يُفرض عليها أي جمرك. أما البضائع الشخصية الجديدة أو التجارية فتُطبق عليها النسب المحددة أدناه لكل دولة.'
              : 'Used personal items are strictly 0% exempt under international baggage and personal allowance conventions. New personal or commercial items are subject to specific country tariffs.'}
          </p>
        </div>
      </div>

      {/* Grid of Country Customs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rules.map((rule) => {
          const draft = draftRules[rule.countryCode] || rule;
          const isModified =
            draft.newPersonalGoodsDutyPercent !== rule.newPersonalGoodsDutyPercent ||
            draft.commercialNewDutyPercent !== rule.commercialNewDutyPercent ||
            draft.standardDutyPercent !== rule.standardDutyPercent ||
            draft.usedPersonalExempt !== rule.usedPersonalExempt ||
            draft.notesAr !== rule.notesAr;

          return (
            <div
              key={rule.countryCode}
              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs transition-all ${
                isModified ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                    {rule.countryCode}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isAr ? rule.countryNameAr : rule.countryNameEn}
                    </h3>
                    <span className="text-[11px] text-slate-500">{rule.countryNameEn}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {isAr ? 'أمانات مستعملة 0%' : 'Used 0%'}
                  </span>
                </div>
              </div>

              {/* Duty Inputs */}
              <div className="space-y-3">
                {/* 1. Used Personal Items Exemption */}
                <div className="flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 text-xs">
                  <span className="font-semibold text-emerald-900">
                    {isAr ? 'أمانات شخصية مستعملة:' : 'Used Personal Goods:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-bold">
                      {isAr ? 'معفى قانوناً (0%)' : '0% Exempt'}
                    </span>
                  </div>
                </div>

                {/* 2. New Personal Goods Duty */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {isAr ? 'أمانات شخصية جديدة:' : 'New Personal Goods:'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'هدايا / مشتريات شخصية جديدة' : 'New personal gifts / shopping'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={draft.newPersonalGoodsDutyPercent || 0}
                      onChange={(e) =>
                        handleFieldChange(
                          rule.countryCode,
                          'newPersonalGoodsDutyPercent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="font-bold text-slate-600">%</span>
                  </div>
                </div>

                {/* 3. New Commercial Goods Duty */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {isAr ? 'بضائع تجارية جديدة:' : 'New Commercial Items:'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'شحنات تجارية / كميات' : 'Commercial imports / quantities'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={draft.commercialNewDutyPercent || 0}
                      onChange={(e) =>
                        handleFieldChange(
                          rule.countryCode,
                          'commercialNewDutyPercent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="font-bold text-slate-600">%</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="text-xs space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    {isAr ? 'ملاحظات وتوجيهات جمركية للدولة:' : 'Customs Notes & Regulation:'}
                  </label>
                  <input
                    type="text"
                    value={draft.notesAr || ''}
                    onChange={(e) =>
                      handleFieldChange(rule.countryCode, 'notesAr', e.target.value)
                    }
                    placeholder={isAr ? 'ملاحظة اللائحة الجمركية...' : 'Regulation note...'}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  {rule.lastUpdated
                    ? `${isAr ? 'آخر تحديث:' : 'Updated:'} ${new Date(
                        rule.lastUpdated
                      ).toLocaleDateString()}`
                    : ''}
                </span>
                <button
                  onClick={() => handleSaveSingleRule(rule.countryCode)}
                  disabled={isSaving}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isModified
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ النسبة' : 'Save'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Customs Calculation Simulator */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">
              {isAr ? 'محاكي واختبار احتساب الجمرك التفاعلي' : 'Live Customs Duty Calculation Simulator'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'جرّب احتساب الجمارك فورياً وفقاً لمعايير الدولة ونوع وحالة البضاعة للتأكد من دقة الحسابات.'
                : 'Simulate duty calculation based on item condition and destination country.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          {/* Destination Country */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold">
              {isAr ? 'دولة الوجهة (المستلم):' : 'Destination Country:'}
            </label>
            <select
              value={simCountry}
              onChange={(e) => setSimCountry(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {rules.map((r) => (
                <option key={r.countryCode} value={r.countryCode}>
                  {r.countryCode} - {isAr ? r.countryNameAr : r.countryNameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Item Condition */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold">
              {isAr ? 'حالة البضاعة / الأمانة:' : 'Item Condition:'}
            </label>
            <select
              value={simCondition}
              onChange={(e) => setSimCondition(e.target.value as ItemCondition)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
            >
              <option value="USED_PERSONAL">
                {isAr ? 'أمانات شخصية مستعملة (معفاة 0%)' : 'Used Personal Goods (0% Exempt)'}
              </option>
              <option value="NEW_PERSONAL">
                {isAr ? 'بضائع / أمانات شخصية جديدة' : 'New Personal Goods'}
              </option>
              <option value="NEW_COMMERCIAL">
                {isAr ? 'بضائع تجارية جديدة' : 'New Commercial Goods'}
              </option>
            </select>
          </div>

          {/* Declared Value */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold">
              {isAr ? 'القيمة المصرح بها ($):' : 'Declared Value ($ USD):'}
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="number"
                min="0"
                step="10"
                value={simDeclaredVal}
                onChange={(e) => setSimDeclaredVal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold">
              {isAr ? 'فئة الصنف:' : 'Item Category:'}
            </label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value as ItemCategory)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ELECTRONICS">{isAr ? 'إلكترونيات وأجهزة' : 'Electronics'}</option>
              <option value="CLOTHING">{isAr ? 'ملابس وأقمشة' : 'Clothing'}</option>
              <option value="DOCUMENTS">{isAr ? 'وثائق ومستندات' : 'Documents'}</option>
              <option value="GIFTS">{isAr ? 'هدايا وتذكارات' : 'Gifts'}</option>
              <option value="PERFUMES">{isAr ? 'عطور ومستحضرات' : 'Perfumes'}</option>
              <option value="FOOD_PACKAGED">{isAr ? 'أغذية معلبة' : 'Packaged Food'}</option>
            </select>
          </div>
        </div>

        {/* Simulator Calculation Result Output */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{isAr ? 'الحالة الجمركية:' : 'Customs Status:'}</span>
              {simResult.isExempt ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                  {isAr ? 'معفى تماماً من الجمرك (0%)' : '0% Lawfully Exempt'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-bold">
                  {isAr ? `تخضع للتعريفة (${simResult.customsRatePercent}%)` : `Subject to Duty (${simResult.customsRatePercent}%)`}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px]">
              {simResult.isExempt
                ? isAr
                  ? 'بناءً على لائحة الأمتعة الشخصية المستعملة، لا يتم احتساب أي جمرك على الشحنة.'
                  : 'Used personal items are exempt from customs duty.'
                : isAr
                ? `قيمة الجمرك المقدرة = ${simDeclaredVal}$ × ${simResult.customsRatePercent}%`
                : `Duty = $${simDeclaredVal} × ${simResult.customsRatePercent}%`}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'نسبة الجمرك' : 'Duty Rate'}</span>
              <span className="text-lg font-bold text-white">{simResult.customsRatePercent}%</span>
            </div>
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'قيمة الجمرك المقدرة' : 'Est. Customs Duty'}</span>
              <span className={`text-2xl font-black ${simResult.customsDutyUsd > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${simResult.customsDutyUsd}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Country Tariff */}
      {showAddCountry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {isAr ? 'إضافة دولة وتعريفة جمركية جديدة' : 'Add New Country Customs Tariff'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddCountry(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewCountry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'رمز الدولة (3 أحرف):' : 'Country Code (e.g. QAT):'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={newCountryCode}
                    onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                    placeholder="QAT / KWT / TUR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'اسم الدولة بالعربية:' : 'Country Name (AR):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCountryNameAr}
                    onChange={(e) => setNewCountryNameAr(e.target.value)}
                    placeholder="مثال: قطر"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'اسم الدولة بالإنجليزية:' : 'Country Name (EN):'}
                </label>
                <input
                  type="text"
                  value={newCountryNameEn}
                  onChange={(e) => setNewCountryNameEn(e.target.value)}
                  placeholder="e.g. Qatar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'نسبة بضائع شخصية جديدة (%):' : 'New Personal Duty (%):'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newPersonalDuty}
                    onChange={(e) => setNewPersonalDuty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'نسبة بضائع تجارية جديدة (%):' : 'New Commercial Duty (%):'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newCommercialDuty}
                    onChange={(e) => setNewCommercialDuty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  id="usedExemptCheck"
                  checked={newUsedExempt}
                  onChange={(e) => setNewUsedExempt(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="usedExemptCheck" className="text-xs font-bold text-emerald-900 cursor-pointer">
                  {isAr ? 'إعفاء الأمانات الشخصية المستعملة قانوناً (0%)' : 'Exempt Used Personal Goods (0%)'}
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'ملاحظات اللائحة الجمركية:' : 'Customs Notes / Regulations:'}
                </label>
                <textarea
                  rows={2}
                  value={newNotesAr}
                  onChange={(e) => setNewNotesAr(e.target.value)}
                  placeholder={isAr ? 'شروط خاصة بهذه الدولة...' : 'Special customs regulations...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCountry(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إضافة الدولة' : 'Add Tariff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
