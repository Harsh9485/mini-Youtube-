import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    waichHistory: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Video",
      },
    ],
    userName: {
      tpye: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true,
    },
    email: {
      tpye: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    fullName: {
      tpye: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      tpye: String, // cloudinary url
      required: true,
    },
    coverImage: {
      tpye: String, // cloudinary url
    },
    password: {
      tpye: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      tpye: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", userSchema);

export { User };
