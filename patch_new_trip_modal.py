import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# I need to add state for isCommitted and ticketImage
state_insert = """
  const [isCommitted, setIsCommitted] = useState(false);
  const [ticketImage, setTicketImage] = useState<File | null>(null);
  
"""
content = content.replace("const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);", "const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);\n" + state_insert)

# And in handleRegisterSubmit, check if isCommitted and ticketImage are present
submit_insert = """
    if (!ticketImage) {
      alert(isAr ? 'يجب إرفاق صورة لتذكرة الطيران لإثبات الحجز.' : 'Ticket image is required to prove booking.');
      return;
    }
    if (!isCommitted) {
      alert(isAr ? 'يجب الموافقة على شروط الالتزام بالسفر.' : 'You must agree to the commitment terms.');
      return;
    }
"""

content = content.replace("setIsSubmittingTrip(true);\n    // Mock API call", submit_insert + "\n    setIsSubmittingTrip(true);\n    // Mock API call")


# Replace the form part from <form onSubmit={handleRegisterSubmit} to </form>
old_form = """<form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">"""

# wait, it's easier to just regex the form body out.
# Or just replace the submit button and add the new fields before it.
button_section = """            <button
              type="submit"
              disabled={isSubmittingTrip}"""

new_section = """
            <div>
              <label className="block font-semibold mb-1">{isAr ? 'صورة التذكرة (إثبات الحجز)' : 'Ticket Image (Proof of Booking)'} <span className="text-rose-500">*</span></label>
              <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="w-full text-xs" 
                  onChange={(e) => setTicketImage(e.target.files?.[0] || null)} 
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <input 
                type="checkbox" 
                id="commitment" 
                checked={isCommitted}
                onChange={(e) => setIsCommitted(e.target.checked)}
                className="mt-0.5 accent-rose-600" 
              />
              <label htmlFor="commitment" className="text-[11px] text-rose-900 font-bold leading-tight">
                {isAr 
                  ? 'أتعهد التزاماً قانونياً بصحة الحجز والسفر في الموعد المحدد. أعلم أن أي إلغاء للرحلة بعد ربط الطرود قد يعرضني للمساءلة.' 
                  : 'I legally commit to the validity of this booking and traveling on schedule. I understand that cancelling after packages are linked may lead to liability.'}
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingTrip}"""

content = content.replace(button_section, new_section)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)

