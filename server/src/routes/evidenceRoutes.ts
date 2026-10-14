import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middlewares/auth.js';
import { PaymentEvidence } from '../models/PaymentEvidence.js';
import { Student } from '../models/Student.js';
import { extractEvidenceData } from '../services/aiService.js';
import { reconcileEvidence } from '../services/reconciliationService.js';
import { recordAudit } from '../services/auditService.js';
import { ENV } from '../config/env.js';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(ENV.UPLOAD_DIR)) {
  fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ENV.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// GET all evidence items
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const status = req.query.status as string;

    const query: any = { teacherId };
    if (status) query.status = status;

    const items = await PaymentEvidence.find(query)
      .populate('matchedStudentId', 'name')
      .populate('matchedTransactionId', 'transactionReference amount paymentDate status')
      .sort({ createdAt: -1 });

    res.json({ evidence: items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Extract candidate data from text or simulated OCR
router.post('/extract', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text or OCR content is required for extraction.' });
      return;
    }

    // Fetch known active student names for context-guided matching
    const students = await Student.find({ teacherId, isActive: true }).select('name');
    const knownNames = students.map(s => s.name);

    const extraction = await extractEvidenceData(text, knownNames);
    res.json({ extraction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create payment evidence (Share to Rivo / WhatsApp claim entry)
router.post(
  '/',
  authMiddleware,
  upload.single('screenshot'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = new Types.ObjectId(req.user?.id);
      const {
        source,
        rawText,
        claimedStudentName,
        claimedAmount,
        claimedDate,
        claimedTransactionReference,
        extractedBy,
        extractionDetails,
        autoReconcile,
      } = req.body;

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      // Parse amount safely
      const parsedAmount = claimedAmount ? parseFloat(claimedAmount) : undefined;

      const evidence = await PaymentEvidence.create({
        teacherId,
        source: source || (req.file ? 'whatsapp_screenshot' : 'whatsapp_text'),
        imageUrl,
        rawText,
        claimedStudentName,
        claimedAmount: parsedAmount,
        claimedDate,
        claimedTransactionReference,
        extractedBy: extractedBy || 'manual',
        extractionDetails: extractionDetails ? JSON.parse(extractionDetails) : undefined,
        status: 'pending_review',
      });

      await recordAudit({
        teacherId,
        actorId: req.user?.id,
        actorName: req.user?.name || 'Teacher',
        action: 'EVIDENCE_UPLOAD',
        targetType: 'PaymentEvidence',
        targetId: evidence._id.toString(),
        afterState: evidence.toObject(),
        reason: `Recorded payment evidence claim for ₹${parsedAmount || 0} (${claimedStudentName || 'Unknown Student'})`,
      });

      // Optionally attempt safe automated reconciliation
      let reconResult = null;
      if (autoReconcile === 'true' || autoReconcile === true) {
        reconResult = await reconcileEvidence(evidence._id, teacherId);
      }

      res.status(201).json({
        message: 'Payment evidence saved. Note: Screenshot claims remain unverified until bank-reconciled.',
        evidence,
        reconResult,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT Update/Correct evidence fields before reconciliation
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { claimedStudentName, claimedAmount, claimedDate, claimedTransactionReference, notes, status } = req.body;

    const evidence = await PaymentEvidence.findOneAndUpdate(
      { _id: req.params.id, teacherId },
      {
        $set: {
          claimedStudentName,
          claimedAmount: claimedAmount ? parseFloat(claimedAmount) : undefined,
          claimedDate,
          claimedTransactionReference,
          notes,
          status: status || 'pending_review',
        },
      },
      { new: true }
    );

    if (!evidence) {
      res.status(404).json({ error: 'Evidence record not found' });
      return;
    }

    res.json({ message: 'Evidence fields corrected successfully', evidence });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Trigger reconciliation for evidence item
router.post('/:id/reconcile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const result = await reconcileEvidence(req.params.id as string, teacherId);
    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
