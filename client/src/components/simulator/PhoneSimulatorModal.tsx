import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Camera,
  Mic,
  Send,
  CheckCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Users,
  Search,
  RotateCcw,
} from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

export interface SimulatedChat {
  id: string;
  name: string;
  avatarColor: string;
  avatarText: string;
  isGroup?: boolean;
  studentName: string;
  batchName: string;
  lastMessageTime: string;
  unreadCount?: number;
  messages: Array<{
    id: string;
    sender: 'parent' | 'teacher';
    text?: string;
    timestamp: string;
    receipt?: {
      amount: number;
      utr: string;
      bankName: string;
      paymentTime: string;
      payerName: string;
      studentName: string;
      isSibling?: boolean;
      siblingDetails?: string;
      note?: string;
    };
    evidenceType?: 'verified_match' | 'sibling' | 'partial' | 'pending_bank' | 'unknown_student';
  }>;
}

const SAMPLE_CHATS: SimulatedChat[] = [
  {
    id: 'chat-keerthana',
    name: 'K. Narayanan (Keerthana)',
    avatarColor: 'bg-emerald-600',
    avatarText: 'KN',
    studentName: 'Keerthana',
    batchName: 'Super Seniors',
    lastMessageTime: '10:15 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-1',
        sender: 'teacher',
        text: 'Namaste Narayanan Ji. Monthly fee for Keerthana for October (Super Seniors batch) is ₹1,500. Due by 05 Oct.',
        timestamp: '09:00 AM',
      },
      {
        id: 'msg-2',
        sender: 'parent',
        text: 'Namaste Veda Ma\'am, paid Keerthana\'s October fees via GPay just now. Sharing the receipt.',
        timestamp: '10:14 AM',
      },
      {
        id: 'msg-3',
        sender: 'parent',
        timestamp: '10:15 AM',
        receipt: {
          amount: 1500,
          utr: '428719283741',
          bankName: 'HDFC Bank •••• 4091',
          paymentTime: '14 Oct 2026, 10:14 AM',
          payerName: 'K. Narayanan',
          studentName: 'Keerthana',
          note: 'October Dance Fee - Super Seniors',
        },
        evidenceType: 'verified_match',
      },
    ],
  },
  {
    id: 'chat-rao-family',
    name: 'Srinivas Rao (Laalasa & Lahari)',
    avatarColor: 'bg-teal-600',
    avatarText: 'SR',
    studentName: 'Laalasa & Lahari',
    batchName: 'Juniors & Sub Juniors',
    lastMessageTime: '02:30 PM',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-rao-1',
        sender: 'parent',
        text: 'Hello Veda Ma\'am, I have paid the combined fee of ₹3,000 for both Laalasa (Juniors) and Lahari (Sub Juniors) in a single UPI transfer.',
        timestamp: '02:28 PM',
      },
      {
        id: 'msg-rao-2',
        sender: 'parent',
        timestamp: '02:30 PM',
        receipt: {
          amount: 3000,
          utr: '428719283742',
          bankName: 'ICICI Bank •••• 8821',
          paymentTime: '14 Oct 2026, 02:28 PM',
          payerName: 'Srinivas Rao',
          studentName: 'Laalasa & Lahari',
          isSibling: true,
          siblingDetails: 'Laalasa (₹1,500) + Lahari (₹1,500)',
          note: 'Combined Sibling Fee - October',
        },
        evidenceType: 'sibling',
      },
    ],
  },
  {
    id: 'chat-roopa',
    name: 'S. Venkat (Roopa)',
    avatarColor: 'bg-indigo-600',
    avatarText: 'SV',
    studentName: 'Roopa',
    batchName: 'Seniors',
    lastMessageTime: '11:45 AM',
    messages: [
      {
        id: 'msg-roopa-1',
        sender: 'parent',
        text: 'Hi Ma\'am, paying ₹1,000 as partial installment for Roopa today. Will pay the remaining ₹1,000 before next Saturday.',
        timestamp: '11:43 AM',
      },
      {
        id: 'msg-roopa-2',
        sender: 'parent',
        timestamp: '11:45 AM',
        receipt: {
          amount: 1000,
          utr: '428719283743',
          bankName: 'SBI •••• 2194',
          paymentTime: '14 Oct 2026, 11:42 AM',
          payerName: 'S. Venkat',
          studentName: 'Roopa',
          note: 'Part fee payment (₹1,000 of ₹2,000)',
        },
        evidenceType: 'partial',
      },
    ],
  },
  {
    id: 'chat-alekhya',
    name: 'M. Prasad (Alekhya)',
    avatarColor: 'bg-emerald-700',
    avatarText: 'MP',
    studentName: 'Alekhya',
    batchName: 'Juniors',
    lastMessageTime: '04:15 PM',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-alekhya-1',
        sender: 'parent',
        text: 'Ma\'am, paid Alekhya\'s fee via PhonePe. Reference number is attached in the screenshot.',
        timestamp: '04:14 PM',
      },
      {
        id: 'msg-alekhya-2',
        sender: 'parent',
        timestamp: '04:15 PM',
        receipt: {
          amount: 1500,
          utr: '428719283744',
          bankName: 'Axis Bank •••• 9901',
          paymentTime: '14 Oct 2026, 04:13 PM',
          payerName: 'M. Prasad',
          studentName: 'Alekhya',
          note: 'October fee for Alekhya',
        },
        evidenceType: 'pending_bank',
      },
    ],
  },
  {
    id: 'chat-kavya-unknown',
    name: 'Sunita Sharma (Unknown Student)',
    avatarColor: 'bg-amber-600',
    avatarText: 'SS',
    studentName: 'Kavya Sharma',
    batchName: 'Unregistered',
    lastMessageTime: '01:10 PM',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-kavya-1',
        sender: 'parent',
        text: 'Hello Ma\'am, paid ₹1,800 for Kavya dance class online. Please confirm admission receipt.',
        timestamp: '01:10 PM',
      },
    ],
  },
  {
    id: 'chat-group-official',
    name: '🩰 Naatyavedam Official (All Batches)',
    avatarColor: 'bg-[#18392D]',
    avatarText: 'NV',
    isGroup: true,
    studentName: 'All Students',
    batchName: 'All Batches',
    lastMessageTime: 'Yesterday',
    messages: [
      {
        id: 'msg-grp-1',
        sender: 'teacher',
        text: 'Dear Parents, October month fee schedule has been published on Rivo. Please make payment to UPI ID: naatyavedam@upi and share screenshot here. Thank you! — Veda',
        timestamp: 'Yesterday',
      },
    ],
  },
];

interface PhoneSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconciled?: () => void;
}

export const PhoneSimulatorModal: React.FC<PhoneSimulatorModalProps> = ({
  isOpen,
  onClose,
  onReconciled,
}) => {
  const [chats, setChats] = useState<SimulatedChat[]>(SAMPLE_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>('chat-keerthana');
  const [inputText, setInputText] = useState('');
  const [isDocked, setIsDocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Processing state
  const [processingReceipt, setProcessingReceipt] = useState<any | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [reconciliationResult, setReconciliationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;

    const newMsg = {
      id: 'custom-' + Date.now(),
      sender: 'parent' as const,
      text: inputText.trim(),
      timestamp: 'Just now',
    };

    setChats(prev =>
      prev.map(c =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessageTime: 'Just now',
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setInputText('');
  };

  // Trigger real Rivo OCR & Reconciliation pipeline
  const handleShareWithRivo = async (receipt: any, chat: SimulatedChat) => {
    setProcessingReceipt(receipt);
    setProcessingStep('Reading WhatsApp screenshot with OCR & AI extraction...');
    setReconciliationResult(null);

    try {
      // Step 1: Simulate OCR Extraction
      await new Promise(r => setTimeout(r, 700));
      setProcessingStep(
        `AI Extracted: Student: "${receipt.studentName}", Amount: ₹${receipt.amount.toLocaleString(
          'en-IN'
        )}, UTR: ${receipt.utr}`
      );

      // Step 2: Call real backend API
      await new Promise(r => setTimeout(r, 600));
      setProcessingStep('Sending to Rivo Reconciliation Engine (/api/evidence)...');

      const rawText = `Payment to Naatyavedam\n₹ ${receipt.amount}.00\nCompleted 14 Oct 2026\nUPI Ref No: ${receipt.utr}\nPaid for: ${receipt.studentName}\nPayer: ${receipt.payerName}`;

      const res = await apiFetch<any>('/evidence', {
        method: 'POST',
        body: JSON.stringify({
          source: 'whatsapp_screenshot',
          rawText,
          claimedStudentName: receipt.studentName,
          claimedAmount: receipt.amount,
          claimedTransactionReference: receipt.utr,
        }),
      });

      setProcessingStep('Matching against Bank Credit Ledger...');
      await new Promise(r => setTimeout(r, 500));

      setReconciliationResult({
        success: true,
        receipt,
        chat,
        apiData: res,
      });

      if (onReconciled) {
        onReconciled();
      }
    } catch (err: any) {
      setReconciliationResult({
        success: false,
        receipt,
        chat,
        error: err.message || 'Reconciliation failed',
      });
    }
  };

  const handleUnknownStudentSimulation = async () => {
    setProcessingReceipt({
      amount: 1800,
      utr: 'N/A',
      studentName: 'Kavya Sharma',
      payerName: 'Sunita Sharma',
    });
    setProcessingStep('Analyzing text: "Paid ₹1,800 for Kavya dance class online"...');

    try {
      await new Promise(r => setTimeout(r, 700));
      setProcessingStep('Searching Naatyavedam roster: Student "Kavya Sharma" NOT found!');

      const res = await apiFetch<any>('/evidence', {
        method: 'POST',
        body: JSON.stringify({
          source: 'whatsapp_text',
          rawText: 'Paid ₹1,800 for Kavya dance class online. Please confirm admission receipt.',
          claimedStudentName: 'Kavya Sharma',
          claimedAmount: 1800,
        }),
      });

      await new Promise(r => setTimeout(r, 500));
      setReconciliationResult({
        success: true,
        isException: true,
        reason: 'unknown_student',
        message: 'No student named "Kavya Sharma" found in any batch. Routed to Exceptions Queue!',
        apiData: res,
      });

      if (onReconciled) onReconciled();
    } catch (err: any) {
      setReconciliationResult({
        success: false,
        error: err.message,
      });
    }
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isDocked
          ? 'bottom-4 right-4 w-[410px] h-[85vh] max-h-[820px] shadow-2xl rounded-[44px]'
          : 'inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto'
      }`}
    >
      {/* Outer Phone Shell / Frame */}
      <div className="relative w-full max-w-[395px] h-[780px] bg-[#1C1C1E] rounded-[48px] p-3 shadow-2xl border-4 border-[#2C2C2E] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glossy Screen Glare reflection */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Controls Overlay: Dock, Close */}
        <div className="absolute top-2 right-4 z-40 flex items-center gap-1.5 text-neutral-400">
          <button
            onClick={() => setIsDocked(!isDocked)}
            className="p-1 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title={isDocked ? 'Center simulator' : 'Dock simulator to corner'}
          >
            {isDocked ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Close simulator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Island / Camera Punch Hole */}
        <div className="relative mx-auto mt-1 w-28 h-5 bg-black rounded-full flex items-center justify-center z-30">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700/60 ml-auto mr-2" />
        </div>

        {/* Phone Screen Canvas */}
        <div className="relative flex-1 bg-[#F0F2F5] rounded-[38px] overflow-hidden flex flex-col text-neutral-900 border border-neutral-800 shadow-inner">
          {/* Status Bar */}
          <div className="bg-[#075E54] text-white px-5 pt-1.5 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-tight select-none">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 opacity-90">
              <span className="text-[10px]">5G</span>
              <div className="flex gap-0.5 items-end h-2.5">
                <div className="w-0.5 h-1 bg-white rounded-xs" />
                <div className="w-0.5 h-1.5 bg-white rounded-xs" />
                <div className="w-0.5 h-2 bg-white rounded-xs" />
                <div className="w-0.5 h-2.5 bg-white rounded-xs" />
              </div>
              <div className="w-5 h-2.5 border border-white/80 rounded-xs p-0.5 flex items-center">
                <div className="w-3.5 h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-[#075E54] text-white px-3 py-2.5 flex items-center justify-between shadow-md select-none">
            {activeChat ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Back to Chats"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className={`w-8 h-8 rounded-full ${activeChat.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                >
                  {activeChat.isGroup ? <Users className="w-4 h-4" /> : activeChat.avatarText}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate leading-tight">{activeChat.name}</h4>
                  <p className="text-[10px] text-emerald-200 truncate leading-tight">
                    {activeChat.isGroup
                      ? 'Veda, Narayanan, Srinivas, Venkat...'
                      : `${activeChat.batchName} • Online`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">WhatsApp</span>
                  <span className="text-[9px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded-full uppercase font-bold">
                    Naatyavedam
                  </span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <Search className="w-4 h-4" />
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            )}

            {activeChat && (
              <div className="flex items-center gap-2.5 text-emerald-100 shrink-0">
                <Video className="w-4 h-4 opacity-80" />
                <Phone className="w-3.5 h-3.5 opacity-80" />
                <MoreVertical className="w-4 h-4 opacity-80" />
              </div>
            )}
          </div>

          {/* Subheader Tabs (When in Chat List) */}
          {!activeChat && (
            <div className="bg-[#075E54] text-white flex text-xs font-bold border-t border-emerald-800/40 select-none">
              <button className="flex-1 py-2 text-center border-b-2 border-white text-white">
                CHATS ({chats.length})
              </button>
              <button className="flex-1 py-2 text-center text-emerald-200/70 opacity-60">
                STATUS
              </button>
              <button className="flex-1 py-2 text-center text-emerald-200/70 opacity-60">
                CALLS
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto relative">
            {!activeChat ? (
              /* CHAT LIST VIEW */
              <div className="divide-y divide-neutral-200/60 bg-white">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className="p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 rounded-full ${chat.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                    >
                      {chat.isGroup ? <Users className="w-5 h-5" /> : chat.avatarText}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-neutral-900 truncate">
                          {chat.name}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {chat.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {chat.messages[chat.messages.length - 1]?.text || '📷 Payment Screenshot'}
                      </p>
                    </div>
                    {chat.unreadCount && (
                      <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                ))}

                <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#15966A]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Simulation Helper</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 leading-relaxed">
                    Select a parent chat above to view incoming WhatsApp payment receipts, then click{' '}
                    <strong>"Share to Rivo"</strong> to test real reconciliation!
                  </p>
                </div>
              </div>
            ) : (
              /* INDIVIDUAL CONVERSATION VIEW */
              <div className="min-h-full bg-[#EFEAE2] p-3 flex flex-col justify-end space-y-3 bg-[radial-gradient(#d3cbbd_1px,transparent_1px)] [background-size:16px_16px]">
                {/* Security Encryption Banner */}
                <div className="mx-auto bg-[#FFEECD] text-[#54656F] text-[9px] px-3 py-1.5 rounded-lg shadow-2xs max-w-[280px] text-center leading-tight">
                  🔒 Messages are end-to-end encrypted. Parents send proofs to Teacher Veda.
                </div>

                {/* Messages */}
                {activeChat.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'teacher' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-2.5 shadow-2xs relative text-xs leading-relaxed ${
                        msg.sender === 'teacher'
                          ? 'bg-[#D9FDD3] text-neutral-900 rounded-tr-xs'
                          : 'bg-white text-neutral-900 rounded-tl-xs'
                      }`}
                    >
                      {/* Text content if present */}
                      {msg.text && <p className="mb-1">{msg.text}</p>}

                      {/* Payment Receipt Card if present */}
                      {msg.receipt && (
                        <div className="mt-1 bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 shadow-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#15966A]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>UPI Payment Completed</span>
                            </div>
                            <span className="text-[9px] font-mono text-neutral-400">
                              {msg.receipt.paymentTime.split(',')[0]}
                            </span>
                          </div>

                          <div className="text-center py-1 bg-white rounded-lg border border-emerald-100">
                            <span className="text-lg font-black text-[#18392D] tracking-tight">
                              ₹ {msg.receipt.amount.toLocaleString('en-IN')}.00
                            </span>
                            <div className="text-[10px] text-neutral-500 font-medium">
                              Paid to: <strong>Naatyavedam</strong>
                            </div>
                            <div className="text-[9px] font-mono text-emerald-700">
                              naatyavedam@upi
                            </div>
                          </div>

                          <div className="space-y-0.5 text-[10px] text-neutral-600">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">For Student:</span>
                              <strong className="text-neutral-800">{msg.receipt.studentName}</strong>
                            </div>
                            {msg.receipt.isSibling && (
                              <div className="flex justify-between text-teal-700 font-semibold">
                                <span>Sibling Split:</span>
                                <span>{msg.receipt.siblingDetails}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Payer:</span>
                              <span className="text-neutral-800">{msg.receipt.payerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">UTR / Ref:</span>
                              <span className="font-mono font-bold text-neutral-800">
                                {msg.receipt.utr}
                              </span>
                            </div>
                          </div>

                          {/* ACTION BUTTON: Share With Rivo */}
                          <button
                            onClick={() => handleShareWithRivo(msg.receipt, activeChat)}
                            className="w-full bg-linear-to-r from-[#15966A] to-[#18392D] hover:opacity-95 text-white font-bold text-[11px] py-2 px-3 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
                            <span>⚡ Extract & Reconcile in Rivo</span>
                          </button>
                        </div>
                      )}

                      {/* Timestamp & double ticks */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-neutral-400 font-medium">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'teacher' && (
                          <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Special case test for Unknown Student */}
                {activeChat.id === 'chat-kavya-unknown' && (
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-1 mt-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Test Unknown Student Exception</span>
                    </div>
                    <button
                      onClick={handleUnknownStudentSimulation}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] py-1.5 px-2 rounded-lg cursor-pointer"
                    >
                      ⚡ Test Rivo OCR on "Kavya Sharma"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Bottom Input Bar (Only in chat) */}
          {activeChat && (
            <div className="bg-[#F0F2F5] px-2 py-2 flex items-center gap-1.5 border-t border-neutral-300/80">
              <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xs border border-neutral-200">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message or proof..."
                  className="w-full text-xs bg-transparent focus:outline-hidden text-neutral-800 placeholder-neutral-400"
                />
                <Paperclip className="w-4 h-4 text-neutral-400 shrink-0 cursor-pointer hover:text-neutral-600" />
                <Camera className="w-4 h-4 text-neutral-400 shrink-0 cursor-pointer hover:text-neutral-600" />
              </div>
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-xs hover:bg-[#008f6f] transition-colors cursor-pointer shrink-0"
              >
                {inputText.trim() ? <Send className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Home indicator bar */}
          <div className="bg-[#F0F2F5] py-1 select-none">
            <div className="w-28 h-1 bg-neutral-400 rounded-full mx-auto" />
          </div>
        </div>

        {/* HUD Overlay: Real OCR & Reconciliation Processing */}
        {processingReceipt && (
          <div className="absolute inset-x-3 bottom-3 top-10 bg-black/85 backdrop-blur-md rounded-[38px] p-5 z-50 flex flex-col justify-between text-white animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                  Rivo Intelligent Pipeline
                </span>
              </div>
              <button
                onClick={() => setProcessingReceipt(null)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Middle Live Step Display */}
            <div className="py-4 space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Pipeline Status</span>
                </div>
                <p className="text-xs font-mono text-neutral-200 leading-relaxed">
                  {processingStep}
                </p>
              </div>

              {/* Extraction Card */}
              {reconciliationResult && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {reconciliationResult.isException
                        ? 'Exception Flagged in Rivo'
                        : 'Reconciled & Recorded!'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {reconciliationResult.isException
                      ? reconciliationResult.message
                      : `Evidence claimed for ${processingReceipt.studentName} (₹${processingReceipt.amount.toLocaleString(
                          'en-IN'
                        )}) has been registered in Naatyavedam's ledger.`}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setProcessingReceipt(null);
                        onClose();
                      }}
                      className="flex-1 bg-[#15966A] hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>View in Rivo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProcessingReceipt(null)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded-xl cursor-pointer"
                    >
                      Try Another Chat
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Tech Callout */}
            <div className="text-center text-[10px] text-neutral-400">
              Deterministic Rule Extractor & Gemma AI fallback active.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
