// 🧠 What This Layer Handles
// login : 
    // Finds user
    // Checks active
    // Compares password
    // Generates JWT

// forgotPassword : 
    // Creates secure reset token
    // Sets expiry
    // Does not leak user existence

// resetPassword :
    // Validates token
    // Hashes new password
    // Clears reset fields

const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }

  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({
    id: user.id,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url
    }
  };
};

const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return; // Do not reveal whether email exists
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await userRepository.updateResetToken(user.id, resetToken, expiry);

  return resetToken; // Later you’d email this
};

const resetPassword = async (token, newPassword) => {
  const pool = require('../config/db');

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1',
    [token]
  );

  const user = rows[0];

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  const hashed = await hashPassword(newPassword);

  await userRepository.updatePassword(user.id, hashed);
};


const changePassword = async (userId, oldPassword, newPassword) => {
  const currentHash = await userRepository.findPasswordByUserId(userId);
  
  if (!currentHash) throw new Error('User not found');

  const isMatch = await comparePassword(oldPassword, currentHash);
  if (!isMatch) throw new Error('Incorrect current password');

  const hashed = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, hashed);
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  changePassword
};
