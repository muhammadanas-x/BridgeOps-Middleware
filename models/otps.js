import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Document will be automatically deleted when expiration is reached
  }
});

// Add index for email lookups
otpSchema.index({ email: 1 });

// Pre-save hook to set expiration
otpSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  }
  next();
});

// Method to verify OTP
otpSchema.methods.verifyOTP = function(inputOTP) {
  return this.otp === inputOTP && this.expiresAt > new Date();
};

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

export default OTP;