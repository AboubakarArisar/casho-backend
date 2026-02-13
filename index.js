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

// Mount API routes
const authRoutes = require("./routes/auth.routes");
const committeeRoutes = require("./routes/committee.routes");
const contributionRoutes = require("./routes/contribution.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/committees", committeeRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/admin", adminRoutes);

// simple error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});
