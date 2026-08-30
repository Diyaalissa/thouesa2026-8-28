import re

with open('src/components/wallet/WalletDashboard.tsx', 'r') as f:
    content = f.read()

# Make the upload button show an alert and set uploadingReceipt
old_upload_btn = """onClick={() => setUploadingReceipt(true)}"""
new_upload_btn = """onClick={() => {
                          alert(isAr ? 'تم إرفاق صورة التحويل بنجاح' : 'Transfer receipt uploaded successfully');
                          setUploadingReceipt(true);
                        }}"""
content = content.replace(old_upload_btn, new_upload_btn)

with open('src/components/wallet/WalletDashboard.tsx', 'w') as f:
    f.write(content)

print("Updated upload receipt")
