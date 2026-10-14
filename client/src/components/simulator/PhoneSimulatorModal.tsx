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
  Bot,
  Zap,
} from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

export interface GroupMessage {
  id: string;
  senderType: 'teacher' | 'parent' | 'bot';
  senderName: string;
  senderColor?: string;
  text?: string;
  timestamp: string;
  isExtracted?: boolean;
  receipt?: {
    amount: number;
    utr: string;
    bankName: string;
    paymentTime: string;
    payerName: string;
    studentName: string;
    batchName: string;
    isSibling?: boolean;
    siblingDetails?: string;
    note?: string;
  };
  evidenceType?: 'verified_match' | 'sibling' | 'partial' | 'pending_bank' | 'unknown_student';
}

export interface BatchGroupChat {
  id: string;
  batchName: string;
  groupTitle: string;
  memberCount: number;
  avatarColor: string;
  avatarText: string;
  lastMessagePreview: string;
  lastMessageTime: string;
  unreadCount?: number;
  messages: GroupMessage[];
}

const INITIAL_BATCH_GROUPS: BatchGroupChat[] = [
  {
    id: 'grp-super-seniors',
    batchName: 'Super Seniors',
    groupTitle: '🩰 Naatyavedam — Super Seniors',
    memberCount: 8,
    avatarColor: 'bg-emerald-700',
    avatarText: 'SS',
    lastMessagePreview: 'K. Narayanan: 📷 Payment receipt ₹1,500 sent for Keerthana',
    lastMessageTime: '10:15 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'ss-1',
        senderType: 'teacher',
        senderName: 'Veda (Teacher)',
        text: 'Namaste parents! October month fee of ₹1,500 is due for Super Seniors batch. Please transfer to naatyavedam@upi and share your confirmation screenshot here.',
        timestamp: '09:00 AM',
      },
      {
        id: 'ss-2',
        senderType: 'parent',
        senderName: 'K. Narayanan (Keerthana\'s Father)',
        senderColor: 'text-emerald-700',
        text: 'Namaste Veda Ma\'am, paid Keerthana\'s October fees via GPay just now. Sharing the receipt screenshot below.',
        timestamp: '10:14 AM',
      },
      {
        id: 'ss-3',
        senderType: 'parent',
        senderName: 'K. Narayanan (Keerthana\'s Father)',
        senderColor: 'text-emerald-700',
        timestamp: '10:15 AM',
        receipt: {
          amount: 1500,
          utr: '428719283741',
          bankName: 'HDFC Bank •••• 4091',
          paymentTime: '14 Oct 2026, 10:14 AM',
          payerName: 'K. Narayanan',
          studentName: 'Keerthana',
          batchName: 'Super Seniors',
          note: 'October Dance Fee - Super Seniors',
        },
        evidenceType: 'verified_match',
      },
    ],
  },
  {
    id: 'grp-juniors',
    batchName: 'Juniors',
    groupTitle: '🩰 Naatyavedam — Juniors',
    memberCount: 14,
    avatarColor: 'bg-teal-700',
    avatarText: 'JN',
    lastMessagePreview: 'M. Prasad: 📷 Alekhya fee screenshot attached',
    lastMessageTime: '04:15 PM',
    unreadCount: 2,
    messages: [
      {
        id: 'jn-1',
        senderType: 'teacher',
        senderName: 'Veda (Teacher)',
        text: 'Dear Juniors parents, October fees are due. Mon/Wed/Fri classes are progressing towards Margam pieces. Kindly share UPI receipts.',
        timestamp: 'Yesterday',
      },
      {
        id: 'jn-2',
        senderType: 'parent',
        senderName: 'M. Prasad (Alekhya\'s Father)',
        senderColor: 'text-blue-700',
        text: 'Ma\'am, paid Alekhya\'s fee of ₹1,500 via PhonePe. Reference number is attached in the screenshot.',
        timestamp: '04:14 PM',
      },
      {
        id: 'jn-3',
        senderType: 'parent',
        senderName: 'M. Prasad (Alekhya\'s Father)',
        senderColor: 'text-blue-700',
        timestamp: '04:15 PM',
        receipt: {
          amount: 1500,
          utr: '428719283744',
          bankName: 'Axis Bank •••• 9901',
          paymentTime: '14 Oct 2026, 04:13 PM',
          payerName: 'M. Prasad',
          studentName: 'Alekhya',
          batchName: 'Juniors',
          note: 'October fee for Alekhya',
        },
        evidenceType: 'pending_bank',
      },
      {
        id: 'jn-4',
        senderType: 'parent',
        senderName: 'Srinivas Rao (Laalasa & Lahari\'s Father)',
        senderColor: 'text-purple-700',
        text: 'Hello Veda Ma\'am, I have transferred ₹3,000 combined fee for both Laalasa (Juniors) and Lahari (Sub Juniors) in a single transaction.',
        timestamp: '04:20 PM',
      },
      {
        id: 'jn-5',
        senderType: 'parent',
        senderName: 'Srinivas Rao (Laalasa & Lahari\'s Father)',
        senderColor: 'text-purple-700',
        timestamp: '04:21 PM',
        receipt: {
          amount: 3000,
          utr: '428719283742',
          bankName: 'ICICI Bank •••• 8821',
          paymentTime: '14 Oct 2026, 04:20 PM',
          payerName: 'Srinivas Rao',
          studentName: 'Laalasa',
          batchName: 'Juniors',
          isSibling: true,
          siblingDetails: 'Laalasa (₹1,500) + Lahari (₹1,500)',
          note: 'Combined Sibling Fee - October',
        },
        evidenceType: 'sibling',
      },
      {
        id: 'jn-6',
        senderType: 'parent',
        senderName: 'Sunita Sharma (Unregistered)',
        senderColor: 'text-amber-700',
        text: 'Hello Ma\'am, paid ₹1,800 for Kavya dance class online. Please confirm admission receipt.',
        timestamp: '04:30 PM',
        receipt: {
          amount: 1800,
          utr: '428719283991',
          bankName: 'Paytm Payments Bank',
          paymentTime: '14 Oct 2026, 04:29 PM',
          payerName: 'Sunita Sharma',
          studentName: 'Kavya Sharma',
          batchName: 'Juniors',
          note: 'Dance class admission fee',
        },
        evidenceType: 'unknown_student',
      },
    ],
  },
  {
    id: 'grp-seniors',
    batchName: 'Seniors',
    groupTitle: '🩰 Naatyavedam — Seniors',
    memberCount: 10,
    avatarColor: 'bg-indigo-700',
    avatarText: 'SN',
    lastMessagePreview: 'S. Venkat: 📷 Paid 1st installment ₹1,000 for Roopa',
    lastMessageTime: '11:45 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'sn-1',
        senderType: 'teacher',
        senderName: 'Veda (Teacher)',
        text: 'Dear Seniors, Varnam rehearsals commence this week. Kindly clear October monthly fee of ₹2,000.',
        timestamp: '10:00 AM',
      },
      {
        id: 'sn-2',
        senderType: 'parent',
        senderName: 'S. Venkat (Roopa\'s Father)',
        senderColor: 'text-indigo-700',
        text: 'Namaste Veda Ma\'am, paying ₹1,000 as 1st installment for Roopa today. Will pay remaining ₹1,000 next Saturday.',
        timestamp: '11:43 AM',
      },
      {
        id: 'sn-3',
        senderType: 'parent',
        senderName: 'S. Venkat (Roopa\'s Father)',
        senderColor: 'text-indigo-700',
        timestamp: '11:45 AM',
        receipt: {
          amount: 1000,
          utr: '428719283743',
          bankName: 'SBI •••• 2194',
          paymentTime: '14 Oct 2026, 11:42 AM',
          payerName: 'S. Venkat',
          studentName: 'Roopa',
          batchName: 'Seniors',
          note: 'Part fee payment (₹1,000 of ₹2,000)',
        },
        evidenceType: 'partial',
      },
    ],
  },
  {
    id: 'grp-sub-juniors',
    batchName: 'Sub Juniors',
    groupTitle: '🩰 Naatyavedam — Sub Juniors',
    memberCount: 12,
    avatarColor: 'bg-rose-700',
    avatarText: 'SJ',
    lastMessagePreview: 'R. Sharma: 📷 Paid ₹1,500 for Priyanka',
    lastMessageTime: '12:10 PM',
    unreadCount: 1,
    messages: [
      {
        id: 'sj-1',
        senderType: 'teacher',
        senderName: 'Veda (Teacher)',
        text: 'Welcome to October batch for Sub Juniors! Fee is ₹1,500. Please share payment screenshots here.',
        timestamp: 'Yesterday',
      },
      {
        id: 'sj-2',
        senderType: 'parent',
        senderName: 'R. Sharma (Priyanka\'s Guardian)',
        senderColor: 'text-rose-700',
        text: 'Transferred ₹1,500 for Priyanka through GPay. Screenshot attached.',
        timestamp: '12:09 PM',
      },
      {
        id: 'sj-3',
        senderType: 'parent',
        senderName: 'R. Sharma (Priyanka\'s Guardian)',
        senderColor: 'text-rose-700',
        timestamp: '12:10 PM',
        receipt: {
          amount: 1500,
          utr: '428719283746',
          bankName: 'HDFC Bank •••• 1022',
          paymentTime: '14 Oct 2026, 12:08 PM',
          payerName: 'R. Sharma',
          studentName: 'Priyanka',
          batchName: 'Sub Juniors',
          note: 'October Sub Juniors Fee',
        },
        evidenceType: 'verified_match',
      },
      {
        id: 'sj-4',
        senderType: 'parent',
        senderName: 'Srinivas Rao (Lahari\'s Father)',
        senderColor: 'text-purple-700',
        text: 'Note: Fee for Lahari (₹1,500) was combined with her sister Laalasa and receipt shared in Juniors group.',
        timestamp: '12:15 PM',
      },
    ],
  },
  {
    id: 'grp-eipl-adults',
    batchName: 'EIPL Adults',
    groupTitle: '🩰 Naatyavedam — EIPL Adults',
    memberCount: 6,
    avatarColor: 'bg-amber-700',
    avatarText: 'EA',
    lastMessagePreview: 'Amritha: 📷 Transferred ₹2,000 for October classes',
    lastMessageTime: '09:30 AM',
    messages: [
      {
        id: 'ea-1',
        senderType: 'teacher',
        senderName: 'Veda (Teacher)',
        text: 'Namaste everyone! Adult batch fee for October is ₹2,000. Weekend classes will focus on Abhinaya and Adavus.',
        timestamp: '08:45 AM',
      },
      {
        id: 'ea-2',
        senderType: 'parent',
        senderName: 'Amritha (Adult Student)',
        senderColor: 'text-amber-800',
        text: 'Transferred ₹2,000 for October classes via PhonePe. Here is the transaction receipt.',
        timestamp: '09:29 AM',
      },
      {
        id: 'ea-3',
        senderType: 'parent',
        senderName: 'Amritha (Adult Student)',
        senderColor: 'text-amber-800',
        timestamp: '09:30 AM',
        receipt: {
          amount: 2000,
          utr: '428719283745',
          bankName: 'Federal Bank •••• 4410',
          paymentTime: '14 Oct 2026, 09:28 AM',
          payerName: 'Amritha',
          studentName: 'Amritha',
          batchName: 'EIPL Adults',
          note: 'October EIPL Adults fee',
        },
        evidenceType: 'verified_match',
      },
    ],
  },
  {
    id: 'grp-eipl',
    batchName: 'EIPL',
    groupTitle: '🩰 Naatyavedam — EIPL',
    memberCount: 5,
    avatarColor: 'bg-cyan-800',
    avatarText: 'EP',
    lastMessagePreview: 'Kavita Menon: Rehearsals scheduled for Mon & Thu 7 PM',
    lastMessageTime: 'Yesterday',
    messages: [
      {
        id: 'ep-1',
        senderType: 'teacher',
        senderName: 'Kavita Menon (Instructor)',
        text: 'Dear EIPL team, rehearsals are scheduled every Mon & Thu at 7:00 PM. Please ensure attendance.',
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
  const [batchGroups, setBatchGroups] = useState<BatchGroupChat[]>(INITIAL_BATCH_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string | null>('grp-super-seniors');
  const [inputText, setInputText] = useState('');
  const [isDocked, setIsDocked] = useState(false);

  // Group scanning state
  const [scanningGroup, setScanningGroup] = useState(false);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  // Single extraction processing state
  const [processingReceipt, setProcessingReceipt] = useState<any | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [reconciliationResult, setReconciliationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const activeGroup = batchGroups.find(g => g.id === activeGroupId);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeGroupId) return;

    const newMsg: GroupMessage = {
      id: 'custom-' + Date.now(),
      senderType: 'teacher',
      senderName: 'Veda (Teacher)',
      text: inputText.trim(),
      timestamp: 'Just now',
    };

    setBatchGroups(prev =>
      prev.map(g =>
        g.id === activeGroupId
          ? {
              ...g,
              lastMessagePreview: `Veda: ${inputText.trim()}`,
              lastMessageTime: 'Just now',
              messages: [...g.messages, newMsg],
            }
          : g
      )
    );
    setInputText('');
  };

  // Reconcile a single receipt from the group
  const handleExtractSingleReceipt = async (receipt: any, group: BatchGroupChat, msgId: string) => {
    setProcessingReceipt(receipt);
    setProcessingStep(`Rivo scanning group screenshot for student: "${receipt.studentName}"...`);
    setReconciliationResult(null);

    try {
      await new Promise(r => setTimeout(r, 650));
      setProcessingStep(
        `AI Extracted OCR: Student: "${receipt.studentName}", Batch: "${receipt.batchName}", Amount: ₹${receipt.amount.toLocaleString(
          'en-IN'
        )}, UTR: ${receipt.utr}`
      );

      await new Promise(r => setTimeout(r, 650));
      setProcessingStep('Sending to Rivo Reconciliation Engine (/api/evidence)...');

      const rawText = `Payment to Naatyavedam (${receipt.batchName})\n₹ ${receipt.amount}.00\nCompleted 14 Oct 2026\nUPI Ref No: ${receipt.utr}\nPaid for: ${receipt.studentName}\nPayer: ${receipt.payerName}`;

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

      setProcessingStep('Matching against bank credit transactions...');
      await new Promise(r => setTimeout(r, 500));

      const isUnknown = receipt.evidenceType === 'unknown_student';
      const isSibling = receipt.isSibling;

      let botMessageText = '';
      if (isUnknown) {
        botMessageText = `⚠️ Rivo Bot: Exception flagged! Student "${receipt.studentName}" not found in Naatyavedam roster. Added to Exceptions Queue for Teacher Veda.`;
      } else if (isSibling) {
        botMessageText = `👨‍👧‍👧 Rivo Bot: Sibling Payment Verified! ₹${receipt.amount.toLocaleString(
          'en-IN'
        )} split across siblings (${receipt.siblingDetails}). Marked as PAID in ledger!`;
      } else if (receipt.evidenceType === 'partial') {
        botMessageText = `⚠️ Rivo Bot: Partial Payment Verified! ₹${receipt.amount.toLocaleString(
          'en-IN'
        )} credited for ${receipt.studentName}. Remaining balance marked in ledger.`;
      } else {
        botMessageText = `✅ Rivo Bot: Extracted & Verified! ₹${receipt.amount.toLocaleString(
          'en-IN'
        )} for ${receipt.studentName} matched with bank UTR ${receipt.utr}. Marked as PAID in ${group.batchName} ledger!`;
      }

      // Add automated Rivo Bot reply into the group chat stream
      const botMsg: GroupMessage = {
        id: 'bot-' + Date.now(),
        senderType: 'bot',
        senderName: 'Rivo Reconciliation Bot',
        text: botMessageText,
        timestamp: 'Just now',
      };

      setBatchGroups(prev =>
        prev.map(g =>
          g.id === group.id
            ? {
                ...g,
                messages: g.messages.map(m => (m.id === msgId ? { ...m, isExtracted: true } : m)).concat(botMsg),
              }
            : g
        )
      );

      setReconciliationResult({
        success: true,
        receipt,
        group,
        isException: isUnknown,
        message: botMessageText,
        apiData: res,
      });

      if (onReconciled) onReconciled();
    } catch (err: any) {
      setReconciliationResult({
        success: false,
        receipt,
        group,
        error: err.message || 'Reconciliation failed',
      });
    }
  };

  // One-click batch extraction for all receipts in a group
  const handleExtractAllInGroup = async (group: BatchGroupChat) => {
    const receiptsInGroup = group.messages.filter(m => m.receipt && !m.isExtracted);
    if (receiptsInGroup.length === 0) {
      alert('All receipts in this group have already been extracted!');
      return;
    }

    setScanningGroup(true);
    setScanSummary(`Scanning ${group.groupTitle} for payment receipts...`);

    let extractedCount = 0;
    for (const msg of receiptsInGroup) {
      if (!msg.receipt) continue;
      setScanSummary(`Extracting receipt for ${msg.receipt.studentName} (₹${msg.receipt.amount})...`);
      await new Promise(r => setTimeout(r, 600));

      try {
        await apiFetch<any>('/evidence', {
          method: 'POST',
          body: JSON.stringify({
            source: 'whatsapp_screenshot',
            rawText: `Payment to Naatyavedam (${group.batchName})\n₹ ${msg.receipt.amount}.00\nUPI Ref No: ${msg.receipt.utr}\nPaid for: ${msg.receipt.studentName}`,
            claimedStudentName: msg.receipt.studentName,
            claimedAmount: msg.receipt.amount,
            claimedTransactionReference: msg.receipt.utr,
          }),
        });
        extractedCount++;
      } catch (e) {
        // continue
      }
    }

    // Add summary bot message to group
    const summaryBotMsg: GroupMessage = {
      id: 'bot-batch-' + Date.now(),
      senderType: 'bot',
      senderName: 'Rivo Reconciliation Bot',
      text: `🚀 Rivo Group Scan Complete! Extracted and reconciled ${extractedCount} payment proof(s) from ${group.batchName} group into the Naatyavedam ledger.`,
      timestamp: 'Just now',
    };

    setBatchGroups(prev =>
      prev.map(g =>
        g.id === group.id
          ? {
              ...g,
              messages: g.messages.map(m => (m.receipt ? { ...m, isExtracted: true } : m)).concat(summaryBotMsg),
            }
          : g
      )
    );

    setScanningGroup(false);
    setScanSummary(`✅ Successfully extracted ${extractedCount} receipts from ${group.batchName} group!`);
    if (onReconciled) onReconciled();
  };

  const receiptsInActiveGroup = activeGroup?.messages.filter(m => m.receipt) || [];
  const unextractedCount = receiptsInActiveGroup.filter(m => !m.isExtracted).length;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isDocked
          ? 'bottom-4 right-4 w-[415px] h-[86vh] max-h-[840px] shadow-2xl rounded-[44px]'
          : 'inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto'
      }`}
    >
      {/* Outer Phone Shell / Frame */}
      <div className="relative w-full max-w-[400px] h-[790px] bg-[#1C1C1E] rounded-[48px] p-3 shadow-2xl border-4 border-[#2C2C2E] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
            {activeGroup ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => {
                    setActiveGroupId(null);
                    setScanSummary(null);
                  }}
                  className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Back to Batch Groups"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className={`w-8 h-8 rounded-full ${activeGroup.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate leading-tight">{activeGroup.groupTitle}</h4>
                  <p className="text-[10px] text-emerald-200 truncate leading-tight">
                    {activeGroup.memberCount} members • Teacher: Veda
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">WhatsApp</span>
                  <span className="text-[9px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded-full uppercase font-bold">
                    Batch Groups
                  </span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <Search className="w-4 h-4" />
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            )}

            {activeGroup && (
              <div className="flex items-center gap-2.5 text-emerald-100 shrink-0">
                <Video className="w-4 h-4 opacity-80" />
                <Phone className="w-3.5 h-3.5 opacity-80" />
                <MoreVertical className="w-4 h-4 opacity-80" />
              </div>
            )}
          </div>

          {/* Subheader Tabs (When in Group List) */}
          {!activeGroup && (
            <div className="bg-[#075E54] text-white flex text-xs font-bold border-t border-emerald-800/40 select-none">
              <button className="flex-1 py-2 text-center border-b-2 border-white text-white">
                BATCH GROUPS ({batchGroups.length})
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
          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {!activeGroup ? (
              /* BATCH GROUPS LIST VIEW */
              <div className="divide-y divide-neutral-200/60 bg-white flex-1">
                <div className="p-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#15966A]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Naatyavedam Batch Groups</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Tap group to enter</span>
                </div>

                {batchGroups.map(group => {
                  const receiptCount = group.messages.filter(m => m.receipt).length;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setActiveGroupId(group.id)}
                      className="p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-11 h-11 rounded-full ${group.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs relative`}
                      >
                        <Users className="w-5 h-5" />
                        {receiptCount > 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-black px-1 rounded-full border border-white">
                            {receiptCount} 📷
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {group.groupTitle}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {group.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {group.lastMessagePreview}
                        </p>
                      </div>
                      {group.unreadCount && (
                        <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {group.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })}

                <div className="p-4 bg-emerald-50/40 border-t border-emerald-100 text-center space-y-1.5 mt-auto">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#15966A]">
                    <Bot className="w-4 h-4" />
                    <span>Rivo Group Extraction Simulation</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 leading-relaxed">
                    Students and parents share receipts inside their batch WhatsApp group. Open any group and test the{' '}
                    <strong>"Extract Receipts from Group"</strong> feature!
                  </p>
                </div>
              </div>
            ) : (
              /* INDIVIDUAL BATCH GROUP CHAT VIEW */
              <div className="flex-1 bg-[#EFEAE2] flex flex-col justify-between bg-[radial-gradient(#d3cbbd_1px,transparent_1px)] [background-size:16px_16px]">
                {/* RIVO GROUP EXTRACTION BANNER */}
                <div className="sticky top-0 z-20 bg-linear-to-r from-[#18392D] to-[#15966A] text-white p-2.5 shadow-sm border-b border-emerald-700/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bot className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-black tracking-wide text-emerald-200 uppercase truncate">
                        Rivo Group Scanner
                      </div>
                      <div className="text-[11px] font-bold truncate">
                        {receiptsInActiveGroup.length} Payment Proofs Detected
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExtractAllInGroup(activeGroup)}
                    disabled={scanningGroup || unextractedCount === 0}
                    className="shrink-0 bg-[#DDF7E9] hover:bg-white text-[#18392D] text-[10px] font-extrabold py-1.5 px-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3 h-3 text-[#15966A]" />
                    <span>{scanningGroup ? 'Scanning...' : `Extract All (${unextractedCount})`}</span>
                  </button>
                </div>

                {/* Scan summary alert if triggered */}
                {scanSummary && (
                  <div className="mx-3 mt-2 p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-[11px] font-semibold text-emerald-900 flex items-center justify-between shadow-2xs">
                    <span>{scanSummary}</span>
                    <button onClick={() => setScanSummary(null)}>
                      <X className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </div>
                )}

                {/* Message Stream */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {/* Security Encryption Banner */}
                  <div className="mx-auto bg-[#FFEECD] text-[#54656F] text-[9px] px-3 py-1 rounded-lg shadow-2xs max-w-[280px] text-center leading-tight">
                    🔒 Messages to {activeGroup.batchName} are end-to-end encrypted.
                  </div>

                  {activeGroup.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.senderType === 'teacher'
                          ? 'items-end'
                          : msg.senderType === 'bot'
                          ? 'items-center'
                          : 'items-start'
                      }`}
                    >
                      {/* Bot Confirmation Bubble */}
                      {msg.senderType === 'bot' ? (
                        <div className="bg-[#18392D] text-white border border-emerald-500/30 rounded-2xl p-2.5 max-w-[90%] shadow-xs space-y-1 text-center animate-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-300">
                            <Bot className="w-3.5 h-3.5" />
                            <span>{msg.senderName}</span>
                          </div>
                          <p className="text-[11px] text-emerald-100 leading-snug">{msg.text}</p>
                          <span className="text-[9px] text-emerald-300/60 block">{msg.timestamp}</span>
                        </div>
                      ) : (
                        /* Standard Chat Bubble */
                        <div
                          className={`max-w-[85%] rounded-2xl p-2.5 shadow-2xs relative text-xs leading-relaxed ${
                            msg.senderType === 'teacher'
                              ? 'bg-[#D9FDD3] text-neutral-900 rounded-tr-xs'
                              : 'bg-white text-neutral-900 rounded-tl-xs'
                          }`}
                        >
                          {/* Sender name for group chats */}
                          {msg.senderType === 'parent' && (
                            <div className={`text-[10px] font-bold mb-1 ${msg.senderColor || 'text-teal-700'}`}>
                              {msg.senderName}
                            </div>
                          )}

                          {/* Text content */}
                          {msg.text && <p className="mb-1">{msg.text}</p>}

                          {/* Payment Receipt Screenshot Card */}
                          {msg.receipt && (
                            <div className="mt-1 bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 shadow-xs space-y-2">
                              <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#15966A]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>UPI Screenshot</span>
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
                                  <span className="text-neutral-400">Student:</span>
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

                              {/* Action: Extract from Group */}
                              {msg.isExtracted ? (
                                <div className="w-full bg-emerald-100 text-emerald-800 text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1">
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Reconciled in Ledger</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleExtractSingleReceipt(msg.receipt, activeGroup, msg.id)}
                                  className="w-full bg-linear-to-r from-[#15966A] to-[#18392D] hover:opacity-95 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
                                  <span>Extract with Rivo</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Timestamp & double ticks */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-neutral-400 font-medium">
                            <span>{msg.timestamp}</span>
                            {msg.senderType === 'teacher' && (
                              <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* WhatsApp Bottom Input Bar */}
                <div className="bg-[#F0F2F5] px-2 py-2 flex items-center gap-1.5 border-t border-neutral-300/80 shrink-0">
                  <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xs border border-neutral-200">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Reply as Teacher Veda in ${activeGroup.batchName}...`}
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
              </div>
            )}
          </div>

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
                  Rivo Group Extraction Engine
                </span>
              </div>
              <button
                onClick={() => setProcessingReceipt(null)}
                className="p-1 hover:bg-white/10 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Middle Live Step Display */}
            <div className="py-4 space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Scanning Group Screenshot</span>
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
                        ? 'Flagged in Exceptions Queue'
                        : 'Reconciled in Batch Ledger!'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {reconciliationResult.message}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setProcessingReceipt(null);
                        onClose();
                      }}
                      className="flex-1 bg-[#15966A] hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>View in Rivo Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProcessingReceipt(null)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded-xl cursor-pointer"
                    >
                      Back to Group
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Tech Callout */}
            <div className="text-center text-[10px] text-neutral-400">
              Gemma AI & deterministic rule extractor actively reading group chat stream.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
