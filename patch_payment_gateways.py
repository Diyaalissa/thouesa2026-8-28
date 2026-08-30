import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# We need to add conditional rendering for payment gateways in SEND_PARCEL, INTERNATIONAL_BUY, SPECIFIC_COUNTRY_BUY.
# Wait, they all share the same payment gateways? No, they each have their own.
# Let's search for the CLIQ_JOR button to see how many times it appears.
# Let's just do a regex replace on the buttons.

cliq_target = r"<button\s+type=\"button\"\s+onClick=\{\(\) => setSelectedPaymentGateway\('CLIQ_JOR'\)\}"
cliq_new = """{selectedOriginHub?.countryCode === 'JOR' && (
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CLIQ_JOR')}"""

content = re.sub(cliq_target, cliq_new, content)

edahabia_target = r"<button\s+type=\"button\"\s+onClick=\{\(\) => setSelectedPaymentGateway\('EDAHABIA_DZA'\)\}"
edahabia_new = """{selectedOriginHub?.countryCode === 'DZA' && (
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('EDAHABIA_DZA')}"""
content = re.sub(edahabia_target, edahabia_new, content)

cib_target = r"<button\s+type=\"button\"\s+onClick=\{\(\) => setSelectedPaymentGateway\('CIB_DZA'\)\}"
cib_new = """{selectedOriginHub?.countryCode === 'DZA' && (
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CIB_DZA')}"""
content = re.sub(cib_target, cib_new, content)

# But wait, if we prefix them with conditional statements, we have to close the brackets!
# It's better to just write a script that replaces the entire grid.
