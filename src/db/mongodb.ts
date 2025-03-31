import mongoose, { type ConnectOptions } from "mongoose";
import envConfig from "../config/dotEnv";

const connectDB = async (): Promise<void> => {
  try {
    const mongooseOptions: ConnectOptions = {
      retryWrites: true,
      writeConcern: { w: "majority" },
      readPreference: "nearest",
    };
    await mongoose.connect(envConfig.MONGODB_URI_LOCAL, mongooseOptions);
    // console.log("MongoDB Connected Successfully!");
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB Connection Error:", error);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB Disconnected");
    });
  } catch (error) {
    console.error(
      "Error connecting to MongoDB:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};
const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error(
      "Error disconnecting from MongoDB:",
      error instanceof Error ? error.message : error
    );
  }
};
// const handleShutdown = (): void => {
//   process.on("SIGINT", async () => {
//     console.log("SIGINT received: Closing MongoDB connection...");
//     await disconnectDB();
//     process.exit(0);
//   });
//   process.on("SIGTERM", async () => {
//     console.log("SIGTERM received: Closing MongoDB connection...");
//     await disconnectDB();
//     process.exit(0);
//   });
// };
// handleShutdown();
export { connectDB, disconnectDB };
