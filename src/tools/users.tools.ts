import { tool } from "ai";
import { z } from "zod";
import { connectDB } from "../db/mongodb";
import UserQuery from "../query/users.query";

const getAllUser = tool({
  description: "get all user in the database",

  parameters: z.object({}),
  execute: async () => {
    connectDB();
    try {
      const existingUsers = await UserQuery.findAllUser();

      return {
        success: true,
        message: `Users found.`,
        data: existingUsers,
      };
    } catch (error: any) {
      return { success: false, message: `Error: ${error.message}` };
    }
  },
});

const createUsers = tool({
  description: "Create a new user in the database",
  parameters: z.object({
    email: z.string(),
    password: z.string(),
  }),
  execute: async ({ email, password }) => {
    connectDB();
    try {
      const existingUser = await UserQuery.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: "User already exists." };
      }
      const savedUser = await UserQuery.createUser({ email, password });
      return {
        success: true,
        message: `User ${email} created successfully.`,
        data: savedUser,
      };
    } catch (error: any) {
      return { success: false, message: `Error: ${error.message}` };
    }
  },
});

const getUserByEmail = tool({
  description: "get a user by email in the database",
  parameters: z.object({
    email: z.string(),
  }),
  execute: async ({ email }) => {
    connectDB();
    try {
      const existingUser = await UserQuery.getUserByEmail(email);
      if (!existingUser) {
        return { success: false, message: "User does not exists." };
      }
      return {
        success: true,
        message: `User ${email} found successfully.`,
        data: existingUser,
      };
    } catch (error: any) {
      return { success: false, message: `Error: ${error.message}` };
    }
  },
});

export { getAllUser, createUsers, getUserByEmail };
