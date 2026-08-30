import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

old_input = """                  <input
                    type="text"
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateStoreItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة (مثال: لون أسود، مقاس 42)' : 'Size, Color, Specs'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />"""

new_input = """                  <textarea
                    rows={4}
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateStoreItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة التفصيلية...' : 'Detailed Size, Color, Specs...'}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-y"
                  />"""

content = content.replace(old_input, new_input)

# Let's also do it for countryBuyItems
old_input2 = """                  <input
                    type="text"
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateCountryItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة' : 'Size, Color, Specs'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />"""

new_input2 = """                  <textarea
                    rows={4}
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateCountryItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة التفصيلية...' : 'Detailed Size, Color, Specs...'}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-y"
                  />"""

content = content.replace(old_input2, new_input2)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

