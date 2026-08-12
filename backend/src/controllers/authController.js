const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  // jti (JWT ID) is the opaque identifier stored on the user document for atomic rotation
  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({ id: userId, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken, jti };
}

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, data: null, message: 'name, email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashedPassword });

  const { accessToken, refreshToken, jti } = generateTokens(user._id);
  user.refreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  user.refreshTokenId = jti;
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

  const { accessToken, refreshToken, jti } = generateTokens(user._id);
  user.refreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  user.refreshTokenId = jti;
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

  // Fetch first so we can bcrypt.compare (the hash is needed before the atomic write)
  const user = await User.findById(payload.id);
  if (!user || !user.refreshToken || user.refreshTokenId !== payload.jti) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid refresh token' });
  }

  const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isMatch) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid refresh token' });
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken, jti: newJti } = generateTokens(user._id);
  const newHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);

  // Conditional atomic update: only succeeds when the session we just validated is still current.
  // A concurrent refresh or a post-logout replay will find no matching document and get a 401.
  const updated = await User.findOneAndUpdate(
    { _id: user._id, refreshTokenId: payload.jti },
    { refreshToken: newHash, refreshTokenId: newJti },
  );
  if (!updated) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid refresh token' });
  }

  logger.info({ userId: user._id }, 'Tokens refreshed');

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    message: 'Tokens refreshed',
  });
}

async function logout(req, res) {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null, refreshTokenId: null });
  logger.info({ userId: req.user.id }, 'User logged out');
  res.status(200).json({ success: true, data: null, message: 'Logged out successfully' });
}

module.exports = {
  signup: asyncHandler(signup),
  login: asyncHandler(login),
  refresh: asyncHandler(refresh),
  logout: asyncHandler(logout),
};
