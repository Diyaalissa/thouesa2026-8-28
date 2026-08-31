import re

with open('src/components/traveler/TripEditCancelModals.tsx', 'r') as f:
    content = f.read()

emergency_modal = """
interface EmergencyCancelTripModalProps {
  trip: Trip | null;
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmergencyCancelTripModal: React.FC<EmergencyCancelTripModalProps> = ({
  trip,
  locale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isAr = locale === 'ar';
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !trip) return null;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      setErrorMsg(isAr ? 'يرجى كتابة سبب واضح وتفصيلي (20 حرف على الأقل).' : 'Please provide a detailed reason (at least 20 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Send emergency cancel request to admin
      const res = await fetch(`/api/trips/${trip.id}/emergency-cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تقديم الطلب');
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-red-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                {isAr ? 'طلب إلغاء طارئ للرحلة' : 'Emergency Cancellation Request'}
              </h3>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {isAr ? 'الطرود تم ربطها بالفعل بهذه الرحلة' : 'Packages are already linked to this trip'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-200 text-rose-500 hover:text-rose-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-amber-950">
            <h4 className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              {isAr ? 'تنبيه إداري هام' : 'Important Notice'}
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-800">
              {isAr 
                ? 'لا يمكن إلغاء هذه الرحلة تلقائياً نظراً لارتباط طرود العملاء بها. طلب الإلغاء سيُرسل للإدارة للمراجعة والبت فيه. ستبقى الرحلة نشطة في حسابك حتى يتم توفير مسافر بديل ونقل الطرود إليه.' 
                : 'This trip cannot be auto-cancelled as packages are linked. This request will be sent to admins for review. The trip remains active in your account until a replacement traveler is found.'}
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              {isAr ? 'سبب الإلغاء الطارئ والتفاصيل' : 'Emergency Reason & Details'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAr ? 'يرجى كتابة سبب الإلغاء بالتفصيل ليتم تقييم طلبك من الإدارة...' : 'Please write your detailed emergency reason for admin review...'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {isAr ? 'الحد الأدنى 20 حرفاً.' : 'Minimum 20 characters.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'تراجع' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جارِ الإرسال...' : 'Submitting...') : isAr ? 'إرسال طلب للإدارة' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
"""

content = content + "\n" + emergency_modal

with open('src/components/traveler/TripEditCancelModals.tsx', 'w') as f:
    f.write(content)
