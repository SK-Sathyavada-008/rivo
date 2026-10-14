import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { seedDemoDataForTeacher } from './seed.js';

async function run() {
  try {
    await connectDB();
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
    }

    console.log(`Seeding demo data for ${demoUser.name} (${demoUser.email})...`);
    await seedDemoDataForTeacher(demoUser._id);
    console.log('DEMO DATA SEEDED SUCCESSFULLY!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed execution error:', err);
    process.exit(1);
  }
}

run();
