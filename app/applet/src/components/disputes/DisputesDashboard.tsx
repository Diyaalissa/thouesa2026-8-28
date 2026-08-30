import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, AlertOctagon, CheckCircle2, Clock, X, Image as ImageIcon, Send, Star, RefreshCcw, FileText, ChevronRight, AlertTriangle, Paperclip, User as UserIcon
} from 'lucide-react';
import { User } from '../../types';

interface DisputesDashboardProps {
  currentUser: User;
  isAr: boolean;
}

interface Message {
  id: string;
  sender: 'USER' | 'ADMIN';
  text: string;
  timestamp: string;
  attachments?: string[];
}

interface Dispute {
  id: string;
  shipmentId: string;
  category: 'DAMAGE' | 'MISSING' | 'DELAY' | 'OVERCHARGE';
  status: 'OPEN' | 'PENDING_USER' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
  messages: Message[];
  rating?: number;
  compensationAmount?: number;
}

const mockDisputes: Dispute[] = [
  {
    id: 'DSP-1092',
    shipmentId: 'SHP-9921',
    category: 'DAMAGE',
    status: 'OPEN',
    createdAt: '2023-10-25T10:00:00Z',
    messages: [
      { id: 'm1', sender: 'USER', text: 'The item arrived damaged in the corner.', timestamp: '2023-10-25T10:00:00Z', attachments: ['https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=200&q=80'] },
      { id: 'm2', sender: 'ADMIN', text: 'We apologize for the inconvenience. We are reviewing the images with the carrier.', timestamp: '2023-10-25T11:30:00Z' }
    ]
  },
  {
    id: 'DSP-0881',
    shipmentId: 'SHP-8812',
    category: 'OVERCHARGE',
    status: 'CLOSED',
    createdAt: '2023-10-20T10:00:00Z',
    closedAt: '2023-10-21T15:00:00Z',
    compensationAmount: 15,
    messages: [
      { id: 'm1', sender: 'USER', text: 'I was charged extra at the hub.', timestamp: '2023-10-20T10:00:00Z' },
      { id: 'm2', sender: 'ADMIN', text: 'We have verified the error. The extra amount will be refunded to your wallet.', timestamp: '2023-10-21T14:50:00Z' }
    ],
    rating: 5
  },
  {
    id: 'DSP-0765',
    shipmentId: 'SHP-7765',
    category: 'DELAY',
    status: 'CLOSED',
    createdAt: '2023-10-10T10:00:00Z',
    closedAt: '2023-10-12T10:00:00Z',
    messages: [
      { id: 'm1', sender: 'USER', text: 'My package is delayed by 3 days.', timestamp: '2023-10-10T10:00:00Z' },
      { id: 'm2', sender: 'ADMIN', text: 'Sorry for the delay, it was due to customs clearance. It has now been released.', timestamp: '2023-10-12T09:00:00Z' }
    ]
  }
];

export function DisputesDashboard({ currentUser, isAr }: DisputesDashboardProps) {
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  const selectedDispute = disputes.find(d => d.id === selectedDisputeId);

  // Re-open logic: check if closed within 7 days
  const canReopen = (dispute: Dispute) => {
    if (dispute.status !== 'CLOSED' || !dispute.closedAt) return false;
    const closedDate = new Date(dispute.closedAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedDisputeId) return;
    setDisputes(prev => prev.map(d => {
      if (d.id === selectedDisputeId) {
        return {
          ...d,
          messages: [...d.messages, { id: Math.random().toString(), sender: 'USER', text: newMessage, timestamp: new Date().toISOString() }]
        };
      }
      return d;
    }));
    setNewMessage('');
  };

  const handleRate = (id: string, rating: number) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, rating } : d));
  };

  const handleReopen = (id: string) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'OPEN', closedAt: undefined } : d));
  };

  const getStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'OPEN': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {isAr ? 'مفتوح' : 'Open'}</span>;
      case 'PENDING_USER': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {isAr ? 'بانتظار ردك' : 'Pending You'}</span>;
      case 'RESOLVED':
      case 'CLOSED': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {isAr ? 'مغلق' : 'Closed'}</span>;
    }
  };

  const getCategoryLabel = (cat: Dispute['category']) => {
    switch (cat) {
      case 'DAMAGE': return isAr ? 'تلف الشحنة' : 'Damaged Item';
      case 'MISSING': return isAr ? 'نقص بالمحتويات' : 'Missing Items';
      case 'DELAY': return isAr ? 'تأخير التوصيل' : 'Delivery Delay';
      case 'OVERCHARGE': return isAr ? 'رسوم زائدة' : 'Overcharge';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-brand-500" />
          {isAr ? 'النزاعات والشكاوى' : 'Disputes & Complaints'}
        </h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {isAr ? 'فتح نزاع جديد' : 'Open Dispute'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        
        {/* Ticket List (Left Side) */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden ${selectedDisputeId ? 'hidden lg:flex lg:col-span-1' : 'col-span-1 lg:col-span-1'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-white">{isAr ? 'تذاكر الدعم' : 'Support Tickets'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {disputes.map(dispute => (
              <div 
                key={dispute.id}
                onClick={() => setSelectedDisputeId(dispute.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDisputeId === dispute.id ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 bg-white dark:bg-slate-800'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{dispute.id}</span>
                  {getStatusBadge(dispute.status)}
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">{getCategoryLabel(dispute.category)}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {dispute.shipmentId}
                </p>
                <p className="text-xs text-slate-400 mt-2 truncate">
                  {dispute.messages[dispute.messages.length - 1]?.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat / Details Area (Right Side) */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex-col overflow-hidden lg:col-span-2 ${selectedDisputeId ? 'flex' : 'hidden lg:flex'}`}>
          {selectedDispute ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => setSelectedDisputeId(null)}
                  className="lg:hidden p-2 text-slate-500 bg-slate-200 dark:bg-slate-700 rounded-full"
                >
                  <ChevronRight className={`w-5 h-5 ${isAr ? '' : 'rotate-180'}`} />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                      {getCategoryLabel(selectedDispute.category)}
                    </h3>
                    {getStatusBadge(selectedDispute.status)}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{isAr ? 'شحنة رقم:' : 'Shipment ID:'} <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedDispute.shipmentId}</span></p>
                </div>
              </div>

              {/* SLA Banner */}
              {selectedDispute.status === 'OPEN' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 border-b border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {isAr ? 'تم استلام شكواك، سيقوم فريقنا بالرد خلال 24 ساعة كحد أقصى.' : 'Your complaint is received. Our team will respond within 24 hours maximum.'}
                  </p>
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900">
                {selectedDispute.messages.map((msg, idx) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'USER' ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {msg.sender === 'ADMIN' && (
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
                          <AlertOctagon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-2xl ${msg.sender === 'USER' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm rtl:rounded-tr-sm rtl:rounded-tl-2xl text-slate-800 dark:text-slate-200' : 'bg-brand-600 text-white rounded-tr-sm rtl:rounded-tl-sm rtl:rounded-tr-2xl'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {msg.attachments.map((url, i) => (
                              <img key={i} src={url} alt="Attachment" className="w-20 h-20 object-cover rounded-lg border border-white/20" />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {msg.sender === 'USER' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-10">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}

                {/* Resolution / CSAT area */}
                {selectedDispute.status === 'CLOSED' && (
                  <div className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg">{isAr ? 'تم إغلاق النزاع' : 'Dispute Closed'}</h4>
                      <p className="text-sm text-slate-500 mt-1">{isAr ? 'نأمل أن نكون قد وفقنا في حل المشكلة.' : 'We hope the issue was resolved satisfactorily.'}</p>
                    </div>

                    {selectedDispute.compensationAmount && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 inline-block">
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                          {isAr ? `تم إضافة تعويض مالي بقيمة ${selectedDispute.compensationAmount}$ إلى محفظتك.` : `Compensation of $${selectedDispute.compensationAmount} has been added to your wallet.`}
                        </p>
                      </div>
                    )}

                    {!selectedDispute.rating ? (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{isAr ? 'ما مدى رضاك عن الدعم الفني؟' : 'How satisfied are you with our support?'}</p>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onMouseEnter={() => setRatingHover(star)}
                              onMouseLeave={() => setRatingHover(0)}
                              onClick={() => handleRate(selectedDispute.id, star)}
                              className="p-1 focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star className={`w-8 h-8 ${(ratingHover || selectedDispute.rating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-5 h-5 ${selectedDispute.rating! >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">{isAr ? 'شكراً لتقييمك!' : 'Thank you for your rating!'}</p>
                      </div>
                    )}

                    {canReopen(selectedDispute) && (
                      <div className="pt-4">
                        <button 
                          onClick={() => handleReopen(selectedDispute.id)}
                          className="text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center justify-center gap-2 mx-auto"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          {isAr ? 'إعادة فتح النزاع' : 'Re-open Dispute'}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'متاح خلال 7 أيام من الإغلاق' : 'Available within 7 days of closing'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              {selectedDispute.status !== 'CLOSED' && (
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message...'}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white rounded-xl transition-colors"
                    >
                      <Send className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{isAr ? 'لا يوجد نزاع محدد' : 'No Dispute Selected'}</h3>
              <p className="text-slate-500 max-w-sm">{isAr ? 'اختر نزاعاً من القائمة الجانبية لعرض التفاصيل والمحادثة، أو قم بفتح نزاع جديد.' : 'Select a dispute from the list to view details and chat, or open a new one.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* New Dispute Modal (Mock) */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsCreating(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-brand-500" />
                  {isAr ? 'فتح نزاع جديد' : 'Open New Dispute'}
                </h2>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{isAr ? 'رقم الشحنة المرتبطة' : 'Related Shipment ID'}</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-500">
                    <option value="">{isAr ? 'اختر الشحنة...' : 'Select shipment...'}</option>
                    <option value="SHP-1234">SHP-1234 (Amman → Algiers)</option>
                    <option value="SHP-5678">SHP-5678 (Dubai → Amman)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{isAr ? 'نوع الشكوى' : 'Dispute Type'}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['DAMAGE', 'MISSING', 'DELAY', 'OVERCHARGE'].map(cat => (
                      <label key={cat} className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input type="radio" name="category" className="text-brand-500 focus:ring-brand-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{getCategoryLabel(cat as any)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{isAr ? 'تفاصيل المشكلة' : 'Issue Details'}</label>
                  <textarea 
                    rows={4}
                    placeholder={isAr ? 'يرجى وصف المشكلة بوضوح...' : 'Please describe the issue clearly...'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-500 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{isAr ? 'المرفقات (صور/فيديو كدليل)' : 'Attachments (Photos/Video Evidence)'}</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer transition-colors text-slate-500">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-bold">{isAr ? 'اضغط لرفع الملفات' : 'Click to upload files'}</span>
                    <span className="text-xs">{isAr ? 'الحد الأقصى 5 ميجابايت' : 'Max 5MB'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => {
                    alert(isAr ? 'تم فتح النزاع بنجاح' : 'Dispute created successfully');
                    setIsCreating(false);
                  }}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 rounded-xl text-sm transition-colors"
                >
                  {isAr ? 'تأكيد وإرسال' : 'Submit Dispute'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
