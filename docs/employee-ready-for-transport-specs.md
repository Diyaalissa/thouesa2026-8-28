# THOUESA — Employee Portal: Ready for Transport (جاهزة للنقل)
## Operational Logic, Security Architecture & UX Specifications

---

### 1. Document Overview & Purpose
تحدد هذه الوثيقة المنطق التشغيلي (Operational Logic)، وقواعد الأمان، ومحددات تجربة المستخدم (UX/UI) لشاشة **"جاهزة للنقل" (Ready for Transport)** في بوابة الموظفين (Employee Portal) لمنصة THOUESA.

تعمل هذه الشاشة كـ **قائمة انتظار تشغيلية (Operational Queue)** نهائية وحصرية للطرود التي أتمت بنجاح مراحل الاستلام والفحص الوزني والأمني وتم إغلاقها بالختم الأمني المرقم (`INSPECTED_SEALED`). وهي المحطة الأخيرة للفرع قبل مطابقة الطرود مع المسافرين والرحلات المعتمدة (`Matching & Flight Manifest`).

---

### 2. فلسفة الشاشة وحالة الطرود (Status Philosophy & Strict Boundaries)

1. **الحالة المقبولة حصراً (`INSPECTED_SEALED`):**
   - تعرض الشاشة فقط الطرود التي تحمل الحالة التشغيلية `INSPECTED_SEALED` (أو المعيارية التوافقية `INSPECTED_AND_SEALED`).
   - تقتصر الطرود المعروضة على الفرع المشغل الحالي (`originHubId === currentHub.id`).

2. **الحالات الممنوعة قطعياً من الظهور في هذه القائمة:**
   - `PENDING_DROPOFF` / `PENDING_HUB_DROPOFF`: طرود لم يستلمها الفرع بعد.
   - `RECEIVED_AT_ORIGIN` / `RECEIVED_AT_ORIGIN_HUB`: طرود استُلمت وتنتظر الفحص والوزن.
   - `WEIGHT_ADJUSTMENT_PENDING` / `WEIGHT_DISCREPANCY_PENDING`: طرود عليها فروقات وزن وبانتظار موافقة أو سداد العميل.
   - `REJECTED_PROHIBITED`: طرود مرفوضة أمنياً.
   - `ASSIGNED_TO_TRIP` / `ASSIGNED_TO_TRAVELER`: بمجرد إسناد الطرد إلى رحلة مسافر في شاشة المطابقة (`Matching`)، يختفي فورياً وتلقائياً من هذه الشاشة وينتقل لمسار النقل والمانيفست (`Manifests & Handover`).

---

### 3. سياسة البيانات غير القابلة للتعديل (Strict Read-Only Enforcement)

تعد هذه الشاشة واجهة استعراض وتدقيق تشغيلي وليست واجهة تعديل بيانات (Zero Mutation Interface):
- **الوزن الفعلي (`actualWeightKg`):** يُعرض كقيمة معتمدة نهائية تم تسجيلها على ميزان الفرع الصناعي في مرحلة التفتيش. يُمنع تحريره أو استبداله بالوزن التقديري.
- **نتيجة الفحص (`inspectionNotes` / `inspectedByAgentId`):** بيانات موثقة ومعتمدة من المفتش الأمني.
- **رقم الختم الأمني (`securitySealId`):** ختم الحماية ضد التلاعب المسجل رسمياً مع باركود الحماية.

> **قاعدة ذهبية:** الوزن المعتمد لجميع العمليات الحسابية وقدرة استيعاب حقائب المسافرين في هذه الشاشة هو **`actualWeightKg`** حصراً.

---

### 4. حظر الإسناد المباشر (No Direct Assignment Rule)

- يُمنع منعاً باتاً وضع أي زر إسناد فوري (`Assign Traveler`) ينفذ التخصيص مباشرة من هذه الواجهة.
- الإجراء الرئيسي الوحيد هو زر:
  ```text
  [🔗 البحث عن رحلة مناسبة / Find Compatible Trip]
  ```
- عند النقر، يتم توجيه الموظف برمجياً (`onNavigate('MATCHING', { shipmentId })`) إلى واجهة المطابقة الذكية مع تمرير الطرد المختار مسبقاً للتحقق من المانيفست وسعة المسافر وحجوزات الطيران الفعلية.

---

### 5. خوارزمية الترتيب والأولوية (Priority & Smart Sorting)

يتم ترتيب الطرود في طابور النقل تلقائياً وفق المعايير التالية:
1. **الأولوية القصوى (`URGENT` / `HIGH`):** الشحنات المستعجلة أو الطبية ذات الأولوية أولاً.
2. **اقتراب موعد السفر المفضل (`preferredDepartureDate`):** الشحنات التي يقترب موعد وصولها المطلوب.
3. **أقدمية الانتظار في المستودع (`readySince` / `inspectedAt`):** تطبيق مبدأ FIFO (First-In, First-Out) لمنع تراكم الطرود القديمة.

#### المؤشرات التشغيلية العلوية (Operational KPIs):
- **الطرود الجاهزة (`Ready Parcels`):** إجمالي عدد الطرود المكتملة أمنياً بانتظار رحلة.
- **أولوية عالية (`High Priority`):** عدد الشحنات العاجلة التي تتطلب تسريع المطابقة.
- **الوزن الإجمالي الجاهز (`Total Weight KG`):** مجموع الأوزان الفعلية (`actualWeightKg`) الجاهزة للشحن.
- **أقدم طرد منتظر (`Oldest Waiting`):** زمن انتظار أقدم شحنة جاهزة (بالأيام أو الساعات).

---

### 6. عناصر واجهة المستخدم والـ Drawer الجانبي

1. **الترويسة وأدوات البحث والفلاتر:**
   - شريط بحث فوري يدعم: رقم التتبع (`trackingNumber`)، اسم المستلم والعميل، ورقم الختم الأمني (`securitySealId`).
   - زر مسح الباركود السريع (`Scan QR / Barcode`) عبر الكاميرا للوصول الفوري للطرد في المستودع.
   - فلاتر تشغيلية: الوجهة (`Destination Hub`)، نوع الخدمة (`Service Type`)، نطاق الوزن (`Weight Range`)، درجة الأولوية (`Priority`)، وتوافر رحلات متوافقة (`Trip Compatibility`).
2. **جدول البيانات التشغيلي:**
   - رقم التتبع مع زر النسخ السريع.
   - الوجهة النهائية (المدينة ومطار الوجهة دون إرباك الموظف ببلد المنشأ الحالي).
   - الوزن الفعلي المعتمد `actualWeightKg`.
   - رقم الختم الأمني مع علامة الاعتماد ✓.
   - شارة الأولوية والمدة منذ الجاهزية.
   - عدد الرحلات المتوافقة حالياً مع زر التوجيه للمطابقة.
3. **درج التفاصيل (`Ready for Transport Details Drawer`):**
   - قائمة الجاهزية (`Matching Readiness Checklist`):
     - [✓] اجتاز الفحص الأمني (Inspection Passed)
     - [✓] تم تسجيل الوزن الفعلي بدقة (Actual Weight Confirmed)
     - [✓] الختم الأمني سليم ومثبت (Security Seal Verified & Locked)
     - [✓] لا يوجد حظر جمركي أو تعليق تشغيلي (No Customs or Operational Hold)
   - **التعليق الأمني/الجمركي (Hold Guard):** في حال وجود أي تعليق (`isHold` أو `CUSTOMS_HOLD`)، يتم تعطيل زر "البحث عن رحلة مناسبة" ويظهر تحذير أمني بارز ⚠️ لمنع شحن أي طرد معلق قانونياً.

---

### 7. تجربة الهاتف المحمول (Mobile-First Logistics)
- تحول الجدول إلى بطاقات مدمجة وسريعة القراءة.
- تثبيت زر الإجراء السريع `[🔗 Find Match]` أسفل البطاقة والـ Drawer لضمان سهولة الاستخدام بيد واحدة لضباط المستودع.

---

### 8. معايير التحقق البرمجي (Verification Commands)
```bash
# 1. التأكد من حصر الشحنات بحالة INSPECTED_SEALED
grep -rn "s.currentStatus === 'INSPECTED_SEALED'" src/components/hub/views/ReadyForTransportView.tsx

# 2. التأكد من اعتماد actualWeightKg للعمليات التشغيلية
grep -rn "actualWeightKg" src/components/hub/views/ReadyForTransportView.tsx

# 3. التأكد من توجيه زر المطابقة إلى MATCHING بدون أي دوال إسناد مباشر (Assign)
grep -rn "onNavigate('MATCHING'" src/components/hub/views/ReadyForTransportView.tsx
```
