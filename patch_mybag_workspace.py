import re

with open('src/components/traveler/MyBagWorkspace.tsx', 'r') as f:
    content = f.read()

# Remove the import of categoriesList
content = content.replace("import { categoriesList } from '../../lib/constants';", "")

# Add local definition of categoriesList
categories_code = """
export const categoriesList = [
  { id: 'DOCUMENTS', nameAr: 'مستندات وأوراق', nameEn: 'Documents', icon: '📄' },
  { id: 'ELECTRONICS', nameAr: 'إلكترونيات وأجهزة', nameEn: 'Electronics', icon: '📱' },
  { id: 'CLOTHING_TEXTILES', nameAr: 'ملابس ومنسوجات', nameEn: 'Clothing & Textiles', icon: '👕' },
  { id: 'MEDICATIONS_PERMITTED', nameAr: 'أدوية ومكملات (مسموحة)', nameEn: 'Medications', icon: '💊' },
  { id: 'GIFTS_COSMETICS', nameAr: 'هدايا وعطور', nameEn: 'Gifts & Cosmetics', icon: '🎁' },
  { id: 'FOOD_COMMERCIAL_PACKED', nameAr: 'مواد غذائية معلبة', nameEn: 'Packed Food', icon: '🥫' },
  { id: 'OTHER_SAFE_GOODS', nameAr: 'سلع أخرى (آمنة)', nameEn: 'Other Safe Goods', icon: '📦' }
];
"""
content = content.replace("interface MyBagWorkspaceProps", categories_code + "\ninterface MyBagWorkspaceProps")

# Fix the typescript issues with Object.entries typed as unknown for map, every, length.
# In categorizedShipments map:
# Replace:
# {Object.entries(categorizedShipments).map(([category, items]) => {
# with:
# {Object.entries(categorizedShipments).map(([category, items]: [string, Shipment[]]) => {

content = content.replace(
    "{Object.entries(categorizedShipments).map(([category, items]) => {",
    "{Object.entries(categorizedShipments).map(([category, items]: [string, Shipment[]]) => {"
)

with open('src/components/traveler/MyBagWorkspace.tsx', 'w') as f:
    f.write(content)
