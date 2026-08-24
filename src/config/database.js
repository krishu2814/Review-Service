const mongoose = require("mongoose");
const { MONGODB_URI } = require("./serverConfig");

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("[MongoDB] Connected to Review Service Database (ecommerce_review)");
  } catch (error) {
    console.error("[MongoDB Error] Review Service DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
