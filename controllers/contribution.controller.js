const Contribution = require("../models/contribution.model");
const Committee = require("../models/committee.model");

exports.contribute = async (req, res) => {
  const { committeeId, amount } = req.body;
  try {
    const committee = await Committee.findById(committeeId);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (!committee.members.includes(req.user._id))
      return res
        .status(403)
        .json({ message: "Must be a member to contribute" });
    const contrib = new Contribution({
      committee: committeeId,
      user: req.user._id,
      amount,
    });
    await contrib.save();
    res.status(201).json(contrib);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listForCommittee = async (req, res) => {
  try {
    const contributions = await Contribution.find({
      committee: req.params.id,
    }).populate("user", "name email");
    res.json(contributions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// simulate payout by committee admin: picks next member by rotationIndex
exports.simulatePayout = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id).populate(
      "members",
    );
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (!committee.admin.equals(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({
        message: "Only committee admin or global admin can run payout",
      });
    const members = committee.members;
    if (!members || members.length === 0)
      return res.status(400).json({ message: "No members" });
    const recipient = members[committee.rotationIndex % members.length];
    // calculate total contributions not yet paid out
    const contributions = await Contribution.find({
      committee: committee._id,
      paidOut: false,
    });
    const total = contributions.reduce((s, c) => s + c.amount, 0);
    // mark contributions paid
    await Contribution.updateMany(
      { committee: committee._id, paidOut: false },
      { paidOut: true },
    );
    committee.payouts.push({
      member: recipient._id,
      amount: total,
      date: new Date(),
    });
    committee.rotationIndex = (committee.rotationIndex + 1) % members.length;
    await committee.save();
    res.json({
      recipient: {
        id: recipient._id,
        name: recipient.name,
        email: recipient.email,
      },
      amount: total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
