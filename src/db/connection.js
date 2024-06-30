import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DATABASE_NAME}`
    );
    console.log(`DB Connected !! || Host on ${connection.connection.host}`);
  } catch (error) {
    console.log(`Failed to connect: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
