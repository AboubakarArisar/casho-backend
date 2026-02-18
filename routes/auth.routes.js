const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const auth = require("../middlewares/auth");
const authController = require("../controllers/auth.controller");

router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  authController.register,
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").exists()],
  authController.login,
);

// Get current user profile (includes creditScore & committees)
router.get("/me", auth, authController.getMe);

module.exports = router;
