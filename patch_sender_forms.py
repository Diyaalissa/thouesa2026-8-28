import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# 1. Update Category Dropdown options
cat_target = """<option value="ELECTRONICS">{isAr ? 'إلكترونيات وهواتف' : 'Electronics'}</option>
                <option value="DOCUMENTS">{isAr ? 'وثائق ومستندات رسمية' : 'Documents'}</option>
                <option value="CLOTHING_TEXTILES">{isAr ? 'ملابس وأقمشة' : 'Clothing'}</option>
                <option value="MEDICATIONS_PERMITTED">{isAr ? 'أدوية مصرح بها' : 'Medications'}</option>
                <option value="GIFTS_COSMETICS">{isAr ? 'هدايا ومستحضرات' : 'Gifts & Cosmetics'}</option>"""

cat_new = """<option value="ELECTRONICS">{isAr ? 'بضاعة' : 'Goods'}</option>
                <option value="DOCUMENTS">{isAr ? 'أمانات' : 'Personal Items / Trusts'}</option>
                <option value="GIFTS_COSMETICS">{isAr ? 'بضاعة جديدة' : 'New Goods'}</option>"""

if cat_target in content:
    content = content.replace(cat_target, cat_new)
else:
    print("Warning: Category target not found")

# 2. Insert Length/Width/Height and Insurance/Packaging before 'Detailed Item Description'
dim_target = """          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'وصف تفصيلي لمحتويات الطرد' : 'Detailed Item Description'}</label>"""

dim_new = """          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الطول (سم)' : 'Length (cm)'}</label>
              <input type="number" min="1" value={parcelLengthCm} onChange={(e) => setParcelLengthCm(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'العرض (سم)' : 'Width (cm)'}</label>
              <input type="number" min="1" value={parcelWidthCm} onChange={(e) => setParcelWidthCm(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الارتفاع (سم)' : 'Height (cm)'}</label>
              <input type="number" min="1" value={parcelHeightCm} onChange={(e) => setParcelHeightCm(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'خيارات التوصيل (الاستلام)' : 'Delivery Options'}</label>
            <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
                <option value="HUB">{isAr ? 'الاستلام من المكتب' : 'Hub Pickup'}</option>
                <option value="HOME">{isAr ? 'توصيل لباب البيت' : 'Home Delivery'}</option>
            </select>
          </div>
""" + dim_target

if dim_target in content:
    content = content.replace(dim_target, dim_new)
else:
    print("Warning: Dimensions target not found")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Pass 1 done")
