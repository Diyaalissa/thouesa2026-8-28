const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// The CSS selector is:
// main > div > div > main > div > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1)
// Let's decode the DOM hierarchy in SenderPortal.
// SenderPortal returns:
// <div className="flex h-screen bg-slate-50 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
// Wait! The user's focus mode trace says:
// div#root:nth-of-type(1) > div#thouesa-root-canvas:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1)
// Let's trace it carefully inside `SenderPortal`.
// SenderPortal is rendered inside App.tsx or similar.
// Inside SenderPortal:
// return (
//   <div className="flex h-screen bg-slate-50 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
//     <aside ...>...</aside>
//     <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6 space-y-6"> (This is probably main:nth-of-type(1))
//       {activeTab === 'MY_SHIPMENTS' && (
//         <div className="space-y-6"> (div:nth-of-type(1))
//           <div className="flex flex-wrap ..."> (div:nth-of-type(1))
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> (div:nth-of-type(2))
//             <div className="space-y-3">...</div> (Left Orders List - div:nth-of-type(1))
//             <div className="lg:col-span-2 space-y-4"> (Right: Selected Order Detail - div:nth-of-type(2))
//               <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-6"> (div:nth-of-type(1) -> THE SELECTED ORDER DETAIL BOX)
//
// So, the user is saying: "قم بنقل هذه الخانة إلى النزاعات والشكاوي في القائمة الجانبية في واجهة العميل"
// (Move this box to the Disputes and Claims in the sidebar in the client interface).
// Why are they saying this about the Order Detail Box?
// Because the order detail box has a lot of things inside it.
// Maybe they specifically clicked on a "Dispute" or "Weight Discrepancy" box INSIDE the order detail view?
// The selector ends at `div:nth-of-type(1)`. It doesn't go deeper into a specific alert banner. It points to the ENTIRE Order Detail Box.
// Wait. "قم بنقل هذه الخانة إلى النزاعات والشكاوي في القائمة الجانبية في واجهة العميل."
// Maybe they think the *Weight Discrepancy Action Banner* or the *Dispute details* are inside this Order Detail Box, and they want THAT logic moved to the Disputes tab?
// But I DID move the "File Dispute" button and form to the Disputes tab.
// Wait, is there a "Weight Discrepancy Action Banner" still in the MY_SHIPMENTS detail box? Yes.
// Is it possible they want the "Weight Discrepancy Action Banner" (which asks for approval of extra charge) moved to the Disputes tab?
// No, weight discrepancy is technically a dispute/financial hold.
// Or maybe they saw the "Weight Discrepancy" alert inside MY_SHIPMENTS and said "move this to disputes".
// Let's remove the weight discrepancy action banner from MY_SHIPMENTS and move it to the DISPUTES tab?
// Let's print out what is currently in the Right Order Detail Box.
