const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const contributionController = require("../controllers/contribution.controller");

router.post("/", auth, contributionController.contribute);
router.get("/committee/:id", auth, contributionController.listForCommittee);
router.post(
  "/committee/:id/payout",
  auth,
  contributionController.simulatePayout,
);

module.exports = router;
