// 🧠 What This Does
// hashPassword : 
    // Generates salt
    // Hashes password
    // Returns secure hash

// comparePassword : 
    // Compares plain password with stored hash
    // Returns true/false

const bcrypt = require('bcryptjs');

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword
};
