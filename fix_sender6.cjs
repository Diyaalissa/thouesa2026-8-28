const fs = require('fs');

let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// The weight discrepancy action banner is located at ~line 1824
// Let's remove it from there.

const discrepancyBanner = `                  {/* Weight Discrepancy Action Banner */}
                  {(selectedShipment.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' ||
                    selectedShipment.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING') &&
                    selectedShipment.weightDiscrepancy && (
                    <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs space-y-3 text-amber-200 animate-pulse">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{isAr ? 'تنبيه: فرق وزن بالميزان المعتمد في الفرع (بانتظار موافقتك)' : 'Scale Discrepancy Alert (Approval Pending)'}</span>
                      </div>
                      <p className="leading-relaxed text-slate-300">
                        {isAr
                          ? \`تم وزن الطرد عند الاستلام في الفرع وتبين أن الوزن الفعلي (\${selectedShipment.weightDiscrepancy.actualKg} كغم) يتجاوز الوزن المصرح به مبدئياً (\${selectedShipment.weightDiscrepancy.originalKg} كغم). فرق تكلفة الشحن الإضافي هو: $\${selectedShipment.weightDiscrepancy.priceDelta} USD.\`
                          : \`Actual certified weight is \${selectedShipment.weightDiscrepancy.actualKg} kg vs declared \${selectedShipment.weightDiscrepancy.originalKg} kg. Additional shipping charge: $\${selectedShipment.weightDiscrepancy.priceDelta} USD.\`}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'APPROVE')}
                          className="px-4 py-2 bg-teal-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? \`موافقة وسداد الفرق ($\${selectedShipment.weightDiscrepancy.priceDelta})\` : 'Approve & Pay Difference'}</span>
                        </button>
                        <button
                          onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'REJECT')}
                          className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-red-500/30"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'رفض' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  )}
`;

// Wait, the user specifically wants this moved to Disputes.
// But is the weight discrepancy considered a dispute? Yes.
// So we should:
// 1. Remove it from MY_SHIPMENTS (the Right Order Detail box).
// 2. Put it in DISPUTES (the Dispute Form Right Box).

let success = false;
if (content.includes(discrepancyBanner)) {
  content = content.replace(discrepancyBanner, '');
  
  // Now inject it into the DISPUTES section
  // Above the dispute form, perhaps.
  const injectTarget = `<form onSubmit={handleInlineDisputeSubmit} className="space-y-5">`;
  const injectString = discrepancyBanner + '\n                  ' + injectTarget;
  
  content = content.replace(injectTarget, injectString);
  success = true;
} else {
  // Let's try more flexible search
  const regex = /\{\/\* Weight Discrepancy Action Banner \*\/\}[\s\S]*?\{isAr \? 'رفض' : 'Reject'\}<\/span>\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\}/;
  const match = content.match(regex);
  if (match) {
    content = content.replace(match[0], '');
    const injectTarget = `<form onSubmit={handleInlineDisputeSubmit} className="space-y-5">`;
    content = content.replace(injectTarget, match[0] + '\n                  ' + injectTarget);
    success = true;
  }
}

console.log("Success:", success);
fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);

