const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const roles = require("../middlewares/roles");
const adminController = require("../controllers/admin.controller");
const committeeController = require("../controllers/committee.controller");

// global admin and superadmin can access dashboard
router.get(
  "/metrics",
  auth,
  roles(["admin", "superadmin"]),
  adminController.metrics,
);
router.get(
  "/users",
  auth,
  roles(["admin", "superadmin"]),
  adminController.listUsers,
);
router.get(
  "/committees",
  auth,
  roles(["admin", "superadmin"]),
  adminController.listCommittees,
);

// promote a user to a role (admin or superadmin)
router.post(
  "/promote",
  auth,
  roles(["admin", "superadmin"]),
  adminController.promoteUser,
);

// delete a committee (global admin action — reuses committee controller)
router.delete(
  "/committees/:id",
  auth,
  roles(["admin", "superadmin"]),
  committeeController.deleteCommittee,
);

// get credit score for a user by id (admin/superadmin only)
router.get(
  "/users/:id/credit",
  auth,
  roles(["admin", "superadmin"]),
  adminController.getUserCredit,
);

module.exports = router;
