import mongoose, { Schema } from "mongoose";

const RoleTypes = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "User",
};

export interface IUser {
  email: string;
  password: string;
  role: string;
  is_deleted: boolean;
}

const Userschema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,

      maxlength: [100, "Email must be at most 100 characters"],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: [RoleTypes.SUPER_ADMIN, RoleTypes.ADMIN, RoleTypes.USER],
      default: RoleTypes.USER,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<IUser>("User", Userschema);

export default UserModel;
