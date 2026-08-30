import re
with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace("import React, { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';\n//, useEffect } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
