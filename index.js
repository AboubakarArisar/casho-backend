const express = require("express");
const app = express();
const cors = require("cors");
const connectDb = require("./utils/db");

connectDb();
require("dotenv").config();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "hello from backend of casho" });
});
