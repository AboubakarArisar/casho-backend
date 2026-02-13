require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

console.log("MONGO_URI:", MONGO_URI);
const connectDb = () => {
  const conn = mongoose.connect(MONGO_URI);
  console.log("MongoDB Connected");
  return conn;
};

module.exports = connectDb;
