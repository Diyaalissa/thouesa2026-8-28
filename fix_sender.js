const fs = require('fs');
let code = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// The file currently ends with:
//       />
//     </div>
//   );
// };

code = code.replace(/    <\/div>\n  \);\n};\n?$/, '        </main>\n      </div>\n    </div>\n  );\n};\n');

fs.writeFileSync('src/components/sender/SenderPortal.tsx', code);
