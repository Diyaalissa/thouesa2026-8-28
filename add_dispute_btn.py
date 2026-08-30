import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

btn_pattern = r"""                      <button
                        onClick=\{\(\) => setChatModalOpen\(true\)\}
                        className="flex items-center gap-2 px-4 py-2\.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
                      >
                        <MessageSquare className="w-4 h-4 text-brand-400" />
                        <span>\{isAr \? 'محادثة الدعم' : 'Support Chat'\}<\/span>
                      <\/button>"""

new_btns = """                      <button
                        onClick={() => setChatModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
                      >
                        <MessageSquare className="w-4 h-4 text-brand-400" />
                        <span>{isAr ? 'محادثة الدعم' : 'Support Chat'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setDisputeModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-red-500/20"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>{isAr ? 'فتح نزاع' : 'Open Dispute'}</span>
                      </button>"""

if re.search(btn_pattern, content):
    content = re.sub(btn_pattern, new_btns, content)
else:
    print("Pattern not found!")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
