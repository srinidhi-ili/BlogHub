const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Model Schema
 *
 * Concepts for College / Viva Presentation:
 * 1. Mongoose Schema vs Model:
 *    - Schema defines the structure of the document, default values, validators, etc.
 *    - Model provides an interface to the database for creating, querying, updating, deleting records.
 *
 * 2. Password Security with Bcrypt:
 *    - Passwords must NEVER be stored in plaintext. If the database is compromised, plaintext passwords
 *      expose all accounts immediately.
 *    - Salting (bcrypt.genSalt(10)): Adds random characters before hashing so two identical passwords
 *      produce completely different hashes, thwarting rainbow table attacks.
 *    - Hashing (bcrypt.hash): A one-way cryptographic function. You can never "decrypt" the hash;
 *      verification is done by hashing the incoming password with the same salt and comparing.
 *
 * 3. Pre-save Middleware (Hooks):
 *    - Executes automatically before the document is saved to the database.
 *    - `isModified('password')` prevents re-hashing an already-hashed password when updating other fields
 *      (like user's name).
 *
 * 4. JSON Web Tokens (JWT):
 *    - Stateless authentication standard.
 *    - Contains three parts: Header (algorithm), Payload (user claims like ID), and Signature (signed with secret).
 *    - The server signs the token using JWT_SECRET. The client sends it back in subsequent requests,
 *      allowing the server to verify user identity without querying session tables on every request.
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Excludes password from query results by default for security
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Pre-save hook: Hash password before saving to database
 */
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt with cost factor 10 (2^10 iterations)
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance Method: Compare candidate password with hashed password in database
 * @param {string} enteredPassword - Plaintext password from login request
 * @returns {Promise<boolean>}
 */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance Method: Sign and return a JWT token for the user
 * @returns {string} - Signed JWT token containing the user ID
 */
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = mongoose.model('User', UserSchema);
