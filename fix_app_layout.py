import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_main = "<main className={`flex-1 w-full mx-auto ${['PUBLIC', 'LEGAL'].includes(currentRole) ? 'max-w-7xl px-4 py-6' : 'p-0 h-[calc(100vh-64px)] overflow-hidden'}`}>"
new_main = "<main className={`flex-1 w-full mx-auto flex flex-col ${['PUBLIC', 'LEGAL'].includes(currentRole) ? 'max-w-7xl px-4 py-6' : 'p-0'}`}>"

if old_main in content:
    content = content.replace(old_main, new_main)
else:
    print("Could not find the old main string")

with open('src/App.tsx', 'w') as f:
    f.write(content)
