const jwt = require("jsonwebtoken");

const sign = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { sign };
