#!/bin/bash
# Reorder tabs in SenderPortal.tsx using a python script for precision
python3 -c "
import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Find the start of the sidebar div
sidebar_start_marker = '<div className=\"p-4 space-y-2 flex-1\">'
start_idx = content.find(sidebar_start_marker) + len(sidebar_start_marker)
end_idx = content.find('</aside>', start_idx)

# Extract the buttons block
buttons_block = content[start_idx:end_idx]

# I need to separate buttons based on their onClick handler
tabs = ['OVERVIEW', 'SEND_PARCEL', 'INTERNATIONAL_BUY', 'SPECIFIC_COUNTRY_BUY', 'MY_SHIPMENTS', 'WALLET', 'PROFILE', 'DISPUTES']

import re
button_pattern = re.compile(r'<button[\s\S]*?</button>')
buttons = button_pattern.findall(buttons_block)

tab_to_button = {}
for b in buttons:
    if \"setActiveTab('OVERVIEW')\" in b: tab_to_button['OVERVIEW'] = b
    elif \"setActiveTab('PROFILE')\" in b: tab_to_button['PROFILE'] = b
    elif \"setActiveTab('MY_SHIPMENTS')\" in b: tab_to_button['MY_SHIPMENTS'] = b
    elif \"setActiveTab('SEND_PARCEL')\" in b: tab_to_button['SEND_PARCEL'] = b
    elif \"setActiveTab('INTERNATIONAL_BUY')\" in b: tab_to_button['INTERNATIONAL_BUY'] = b
    elif \"setActiveTab('SPECIFIC_COUNTRY_BUY')\" in b: tab_to_button['SPECIFIC_COUNTRY_BUY'] = b
    elif \"setActiveTab('DISPUTES')\" in b: tab_to_button['DISPUTES'] = b
    elif \"setActiveTab('WALLET')\" in b: tab_to_button['WALLET'] = b

new_buttons_block = ''
for t in tabs:
    if t in tab_to_button:
        new_buttons_block += '\n            ' + tab_to_button[t]

new_content = content[:start_idx] + new_buttons_block + '\n          </div>\n        ' + content[end_idx:]

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(new_content)
"
