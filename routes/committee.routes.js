const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const committeeController = require("../controllers/committee.controller");

router.get("/", auth, committeeController.listCommittees);
router.post("/", auth, committeeController.createCommittee);
router.get("/:id", auth, committeeController.getCommittee);
router.put("/:id", auth, committeeController.updateCommittee);
router.delete("/:id", auth, committeeController.deleteCommittee);
router.post("/:id/join", auth, committeeController.joinCommittee);
router.post("/:id/leave", auth, committeeController.leaveCommittee);
router.get("/:id/members", auth, committeeController.listMembers);
router.delete("/:id/members/:userId", auth, committeeController.removeMember);

module.exports = router;
