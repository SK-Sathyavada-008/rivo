import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.js';
import { Student } from '../models/Student.js';
import { Batch } from '../models/Batch.js';
import { Family } from '../models/Family.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// ================= STUDENTS =================

const StudentSchema = z.object({
  name: z.string().min(2, 'Student name is required'),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  batchId: z.string().min(1, 'Batch is required'),
  familyId: z.string().optional().nullable(),
  monthlyFee: z.number().min(0, 'Monthly fee must be 0 or positive'),
  joiningDate: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

// GET all students
router.get('/students', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { batchId, active, search } = req.query;

    const query: any = { teacherId };

    if (batchId) {
      query.batchId = new Types.ObjectId(batchId as string);
    }
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    if (search) {
      query.name = { $regex: search as string, $options: 'i' };
    }

    const students = await Student.find(query)
      .populate('batchId', 'name schedule')
      .populate('familyId', 'name guardianName guardianPhone')
      .sort({ name: 1 });

    res.json({ students });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single student with obligation history
router.get('/students/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const student = await Student.findOne({ _id: req.params.id, teacherId })
      .populate('batchId', 'name schedule')
      .populate('familyId', 'name guardianName guardianPhone');

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const obligations = await FeeObligation.find({ teacherId, studentId: student._id }).sort({
      billingMonth: -1,
    });

    res.json({ student, obligations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE student
router.post('/students', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = StudentSchema.parse(req.body);

    const student = await Student.create({
      ...data,
      teacherId,
      batchId: new Types.ObjectId(data.batchId),
      familyId: data.familyId ? new Types.ObjectId(data.familyId) : undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    });

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'STUDENT_CREATE',
      targetType: 'Student',
      targetId: student._id.toString(),
      afterState: student.toObject(),
      reason: `Added new student: ${student.name}`,
    });

    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// UPDATE student
router.put('/students/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = StudentSchema.partial().parse(req.body);

    const before = await Student.findOne({ _id: req.params.id, teacherId });
    if (!before) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const updateData: any = { ...data };
    if (data.batchId) updateData.batchId = new Types.ObjectId(data.batchId);
    if (data.familyId !== undefined) {
      updateData.familyId = data.familyId ? new Types.ObjectId(data.familyId) : null;
    }
    if (data.joiningDate) updateData.joiningDate = new Date(data.joiningDate);

    const updated = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId },
      { $set: updateData },
      { new: true }
    );

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'STUDENT_UPDATE',
      targetType: 'Student',
      targetId: String(req.params.id),
      beforeState: before.toObject(),
      afterState: updated?.toObject(),
      reason: `Updated student details for ${updated?.name}`,
    });

    res.json({ message: 'Student updated successfully', student: updated });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// ARCHIVE / DELETE student (soft-delete by marking inactive)
router.delete('/students/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'STUDENT_ARCHIVE',
      targetType: 'Student',
      targetId: String(req.params.id),
      reason: `Archived/Deactivated student: ${student.name}`,
    });

    res.json({ message: 'Student archived successfully', student });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= BATCHES =================

const BatchSchema = z.object({
  name: z.string().min(2, 'Batch name is required'),
  schedule: z.string().optional(),
  instructor: z.string().optional(),
  isActive: z.boolean().default(true),
});

router.get('/batches', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const batches = await Batch.find({ teacherId }).sort({ name: 1 });

    // Attach student count
    const batchList = [];
    for (const b of batches) {
      const studentCount = await Student.countDocuments({
        teacherId,
        batchId: b._id,
        isActive: true,
      });
      batchList.push({
        ...b.toObject(),
        studentCount,
      });
    }

    res.json({ batches: batchList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batches', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = BatchSchema.parse(req.body);

    const batch = await Batch.create({
      ...data,
      teacherId,
    });

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'BATCH_CREATE',
      targetType: 'Batch',
      targetId: batch._id.toString(),
      afterState: batch.toObject(),
      reason: `Created batch: ${batch.name}`,
    });

    res.status(201).json({ message: 'Batch created successfully', batch });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/batches/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = BatchSchema.partial().parse(req.body);

    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, teacherId },
      { $set: data },
      { new: true }
    );

    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    res.json({ message: 'Batch updated successfully', batch });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= FAMILIES =================

const FamilySchema = z.object({
  name: z.string().min(2, 'Family name is required'),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/families', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const families = await Family.find({ teacherId }).sort({ name: 1 });

    const results = [];
    for (const f of families) {
      const students = await Student.find({
        teacherId,
        familyId: f._id,
        isActive: true,
      }).select('name monthlyFee batchId');

      results.push({
        ...f.toObject(),
        students,
      });
    }

    res.json({ families: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/families', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = FamilySchema.parse(req.body);

    const family = await Family.create({
      ...data,
      teacherId,
    });

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'FAMILY_CREATE',
      targetType: 'Family',
      targetId: family._id.toString(),
      afterState: family.toObject(),
      reason: `Created family link: ${family.name}`,
    });

    res.status(201).json({ message: 'Family created successfully', family });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
