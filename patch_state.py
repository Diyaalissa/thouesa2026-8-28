import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add states around line 180 (after parcelEstimatedWeightKg)
state_target = r"const \[parcelEstimatedWeightKg, setParcelEstimatedWeightKg\] = useState\(2\.0\);"
state_new = """const [parcelEstimatedWeightKg, setParcelEstimatedWeightKg] = useState(2.0);
  const [deliveryType, setDeliveryType] = useState('HUB');
  const [selectedTripId, setSelectedTripId] = useState('trip-1');
  const [packagingRequested, setPackagingRequested] = useState(false);"""

content = re.sub(state_target, state_new, content)

# Update delivery select in SEND_PARCEL
# We had: <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
# Let's replace ALL instances of this specific bare select.
content = content.replace(
    '<select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">\n                <option value="HUB">{isAr ? \'الاستلام من المكتب\' : \'Hub Pickup\'}</option>\n                <option value="HOME">{isAr ? \'توصيل لباب البيت\' : \'Home Delivery\'}</option>\n            </select>',
    '<select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">\n                <option value="HUB">{isAr ? \'الاستلام من المكتب\' : \'Hub Pickup\'}</option>\n                <option value="HOME">{isAr ? \'توصيل لباب البيت\' : \'Home Delivery\'}</option>\n            </select>'
)

# Update trip select in SEND_PARCEL
content = content.replace(
    '<select className="w-full px-3 py-2.5 bg-slate-800 border border-amber-500/50 rounded-xl text-xs text-white">',
    '<select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-amber-500/50 rounded-xl text-xs text-white">'
)
# Update packaging checkbox in SEND_PARCEL
content = content.replace(
    'id="packagingCheckbox"',
    'id="packagingCheckbox" checked={packagingRequested} onChange={(e) => setPackagingRequested(e.target.checked)}'
)
content = content.replace(
    'id="packagingCheckboxIntl"',
    'id="packagingCheckboxIntl" checked={packagingRequested} onChange={(e) => setPackagingRequested(e.target.checked)}'
)
content = content.replace(
    'id="packagingCheckboxOpt3"',
    'id="packagingCheckboxOpt3" checked={packagingRequested} onChange={(e) => setPackagingRequested(e.target.checked)}'
)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Pass 5 done")
