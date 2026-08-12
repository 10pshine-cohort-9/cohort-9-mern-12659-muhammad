const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: [3, 'Name must be at least 3 characters long'], maxlength: [30, 'Name must be at most 30 characters long'] },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // storing as bcrypt hash
    password: { type: String, required: true },
    // hashed refresh token... null when logged out
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
