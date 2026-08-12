const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, data: null, message: 'name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, data: null, message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashedPassword });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  await user.save();

  logger.info({ userId: user._id }, 'User signed up');

  res.status(201).json({
    success: true,
    data: { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email } },
    message: 'Signup successful',
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, data: null, message: 'email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  await user.save();

  logger.info({ userId: user._id }, 'User logged in');

  res.status(200).json({
    success: true,
    data: { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email } },
    message: 'Login successful',
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, data: null, message: 'refreshToken is required' });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, data: null, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(payload.id);
  if (!user || !user.refreshToken) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid refresh token' });
  }

  const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isMatch) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid refresh token' });
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  user.refreshToken = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
  await user.save();

  logger.info({ userId: user._id }, 'Tokens refreshed');

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    message: 'Tokens refreshed',
  });
}

async function logout(req, res) {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  logger.info({ userId: req.user.id }, 'User logged out');
  res.status(200).json({ success: true, data: null, message: 'Logged out successfully' });
}

module.exports = {
  signup: asyncHandler(signup),
  login: asyncHandler(login),
  refresh: asyncHandler(refresh),
  logout: asyncHandler(logout),
};
