import { clsx } from "clsx";
import mongoose from "mongoose";
import { twMerge } from "tailwind-merge"




export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const connectDB = async () => {
  try {
    // Return existing connection if already established
    if (mongoose.connections[0].readyState) {
      return {
        conn: mongoose.connection,
        db: mongoose.connection.db
      };
    }

    // Create new connection
    const conn = await mongoose.connect("mongodb+srv://midnightdemise123:ud1NWLBc9WjZ5AnM@cluster0.4kunsoy.mongodb.net/is?retryWrites=true&w=majority");
    console.log("MongoDB connected successfully");

    return {
      conn: conn.connection,
      db: conn.connection.db
    };

  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error; // Re-throw to handle in calling code
  }
};

