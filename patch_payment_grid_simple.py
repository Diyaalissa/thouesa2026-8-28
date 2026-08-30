with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

cliq = """<button
                type="button"
                onClick={() => setSelectedPaymentGateway('CLIQ_JOR')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CLIQ_JOR'
                    ? 'bg-brand-500/30 border-brand-400 text-white ring-1 ring-brand-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇯🇴 CliQ Jordan</span>
              </button>"""

edahabia = """<button
                type="button"
                onClick={() => setSelectedPaymentGateway('EDAHABIA_DZA')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'EDAHABIA_DZA'
                    ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇩🇿 بريدي موب / الذهبية</span>
              </button>"""

cib = """<button
                type="button"
                onClick={() => setSelectedPaymentGateway('CIB_DZA')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CIB_DZA'
                    ? 'bg-teal-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇩🇿 بطاقة CIB البنكية</span>
              </button>"""


new_cliq = """{selectedOriginHub?.countryCode === 'JOR' && ( """ + cliq + """ )}"""
new_edahabia = """{selectedOriginHub?.countryCode === 'DZA' && ( """ + edahabia + """ )}"""
new_cib = """{selectedOriginHub?.countryCode === 'DZA' && ( """ + cib + """ )}"""

content = content.replace(cliq, new_cliq)
content = content.replace(edahabia, new_edahabia)
content = content.replace(cib, new_cib)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Simple Payment replace done")
