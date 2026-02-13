const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const roles = require("../middlewares/roles");
const committeeController = require("../controllers/committee.controller");

router.get("/", auth, committeeController.listCommittees);
router.post("/", auth, committeeController.createCommittee);
router.get("/:id", auth, committeeController.getCommittee);
router.post("/:id/join", auth, committeeController.joinCommittee);
router.get("/:id/members", auth, committeeController.listMembers);

module.exports = router;
