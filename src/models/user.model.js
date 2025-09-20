import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  fullName: { type: String, required: true },
  username: { type: String, unique: true },
  phone: { type: String, unique: true },
  gender: { type: String, enum: ["male", "female", "other"] },
  dateOfBirth: { type: Date },
  address: { type: String },
  profileImage: { type: String },
  address: { type: String },
  uniqueCode: { type: Number, unique: true },
  role: { type: String, enum: ["user", "seller", "admin"] },
  status: { type: String, enum: ["active", "pending"], default: "active" },
  refreshToken: { type: String, select: false },
  resetPasswordOTP: { type: String, select: false },
  resetPasswordOTPExpiry: { type: Date, select: false },
  isEmailVerified: { type: Boolean, default: false },
  category: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
});

// Generate a unique user ID when the user is created 4 digit
userSchema.pre("save", function (next) {
  if (this.isNew && !this.uniqueCode) {
    this.code = Math.floor(Math.random() * 9000) + 1000;
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
