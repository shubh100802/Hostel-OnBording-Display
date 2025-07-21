import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

dotenv.config();

const router = express.Router();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password, block } = req.body;
  if (!username || !password || !block) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const user = await User.findOne({ username, block });
  if (!user) {
    return res.status(401).json({ error: 'Invalid username, password, or block.' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username, password, or block.' });
  }
  const token = jwt.sign({ id: user._id, username: user.username, block: user.block }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, block: user.block, username: user.username });
});

export default router; 