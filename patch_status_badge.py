import re

with open('src/components/common/StatusBadge.tsx', 'r') as f:
    content = f.read()

# Let's add the cases
new_cases = """    case 'SCHEDULED':
      label = locale === 'ar' ? 'مجدولة - بانتظار التأكيد' : 'Scheduled';
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-300';
      Icon = Clock;
      break;
    case 'CHECKED_IN':
      label = locale === 'ar' ? 'تم تأكيد السفر' : 'Checked In';
      colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-300';
      Icon = CheckCircle2;
      break;
    case 'PACKAGES_LINKED':
      label = locale === 'ar' ? 'تم ربط الطرود (توجه للمكتب)' : 'Packages Linked (Go to Hub)';
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
      Icon = Box;
      break;
    case 'DRAFT':"""

content = content.replace("    case 'DRAFT':", new_cases)

with open('src/components/common/StatusBadge.tsx', 'w') as f:
    f.write(content)

