import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

async function addUser(username, password, block) {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash, block });
  await user.save();
  console.log('User added:', username, 'for block', block);
  mongoose.disconnect();
}


// addUser('wardenbh1@vitbhopal.ac.in', 'wardenbh1@2025', 'Block 1');
// addUser('wardenbh2@vitbhopal.ac.in', 'wardenbh2@2025', 'Block 2');
addUser('premium@vitbhopal.ac.in', 'premium@2025', 'Premium');
// addUser('warden2', 'pass2', '2');
// addUser('warden3', 'pass3', '3'); 