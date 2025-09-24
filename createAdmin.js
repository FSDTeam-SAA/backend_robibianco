import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

// Load environment variables from .env file
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB using the URI from the .env file
    await mongoose.connect(process.env.MongoDB_URI);
    console.log("Database connected successfully.");

    const adminData = {
      email: "apptestercheck@example.com",
      password: "securepassword22123456", // The password will be hashed automatically by the pre-save hook
      fullName: "Admin User",
      role: "admin",
    };

    // Check if an admin user already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("Admin user already exists. Exiting.");
      return;
    }

    // Create the admin user in the database
    const newAdmin = await User.create(adminData);
    console.log(`Admin user created successfully: ${newAdmin.email}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

createAdminUser();
