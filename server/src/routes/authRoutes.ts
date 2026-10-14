import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUser } from '../models/User.js';
import { ENV } from '../config/env.js';
import { authMiddleware, AuthenticatedUser } from '../middlewares/auth.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import { recordAudit } from '../services/auditService.js';
import { seedDemoDataForTeacher } from '../scripts/seed.js';

const router = Router();

function generateToken(user: IUser): string {
  const payload: AuthenticatedUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    academyName: user.academyName,
    isDemo: user.isDemo,
  };
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// 1. Teacher Registration
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  academyName: z.string().min(2, 'Academy name is required'),
  upiId: z.string().optional(),
  phone: z.string().optional(),
});

router.post('/register', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existing = await User.findOne({ email: validated.email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await User.create({
      email: validated.email.toLowerCase(),
      passwordHash,
      name: validated.name,
      academyName: validated.academyName,
      upiId: validated.upiId,
      phone: validated.phone,
      isDemo: false,
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    await recordAudit({
      teacherId: user._id,
      actorName: user.name,
      action: 'STUDENT_CREATE', // Teacher account registered
      targetType: 'User',
      targetId: user._id.toString(),
      reason: 'Teacher registered new academy account',
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        academyName: user.academyName,
        upiId: user.upiId,
        phone: user.phone,
        isDemo: user.isDemo,
      },
      token,
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// 2. Teacher Login
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        academyName: user.academyName,
        upiId: user.upiId,
        phone: user.phone,
        isDemo: user.isDemo,
      },
      token,
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// 3. Demo Login (Instant evaluation for Judges / DEV Challenge)
router.post('/demo-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const demoEmail = 'demo.teacher@rivo.app';
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('DemoRivo2026!', salt);

      demoUser = await User.create({
        email: demoEmail,
        passwordHash,
        name: 'Ananya Natarajan',
        academyName: 'Nrityanjali Dance Academy',
        upiId: 'nrityanjali@upi',
        phone: '+91 98450 12345',
        isDemo: true,
      });

      // Seed rich realistic demo data for the academy
      await seedDemoDataForTeacher(demoUser._id);
    }

    const token = generateToken(demoUser);
    setAuthCookie(res, token);

    res.json({
      message: 'Logged into Demo Academy successfully',
      user: {
        id: demoUser._id,
        email: demoUser.email,
        name: demoUser.name,
        academyName: demoUser.academyName,
        upiId: demoUser.upiId,
        phone: demoUser.phone,
        isDemo: true,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Demo login failed' });
  }
});

// 4. Reset Demo Data
router.post('/reset-demo', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.isDemo) {
      res.status(403).json({ error: 'Demo data reset is only allowed on demo accounts.' });
      return;
    }

    await seedDemoDataForTeacher(req.user.id);
    res.json({ message: 'Demo data has been reset to default evaluation state.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Reset demo data failed' });
  }
});

// 5. Current User Info
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Update Profile
router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, academyName, upiId, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: { name, academyName, upiId, phone } },
      { new: true }
    ).select('-passwordHash');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
