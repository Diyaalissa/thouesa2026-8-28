import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

target = r"              <div className=\{\`p-2\.5 rounded-xl border \$\{liveParcelQuote\.customsDutyUsd > 0 \? 'bg-amber-950/40 border-amber-500/40' : 'bg-emerald-950/40 border-emerald-500/40'\}\`\}>\s+<span className=\"text-slate-400 text-\[11px\] block\">\{isAr \? 'الجمرك المقدر' : 'Est\. Customs Duty'\}</span>\s+<div className=\"flex items-center gap-1\">\s+<span className=\{\`font-bold text-sm \$\{liveParcelQuote\.customsDutyUsd > 0 \? 'text-amber-400' : 'text-emerald-400'\}\`\}>\s+\$\{liveParcelQuote\.customsDutyUsd\}\s+</span>\s+\{liveParcelQuote\.isCustomsExempt \? \(\s+<span className=\"text-\[10px\] text-emerald-400 font-bold\">\(\{isAr \? 'معفى 0%' : '0%'\}\)</span>\s+\) : \(\s+<span className=\"text-\[10px\] text-amber-400 font-bold\">\(\{liveParcelQuote\.customsRatePercent\}%\)</span>\s+\)\}\s+</div>\s+</div>"

new_content = re.sub(target, "", content)
if new_content == content:
    print("Failed to replace!")
else:
    with open('src/components/sender/SenderPortal.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced!")
