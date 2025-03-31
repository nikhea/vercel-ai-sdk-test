import dotenv from "dotenv";

dotenv.config();

const envConfig = {
  MONGODB_URI_LOCAL: process.env.MONGODB_URI_LOCAL!,
};

export default envConfig;
