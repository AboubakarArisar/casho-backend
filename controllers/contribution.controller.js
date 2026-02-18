const Contribution = require("../models/contribution.model");
const Committee = require("../models/committee.model");
const creditService = require("../services/credit");
const User = require("../models/user.model");

exports.contribute = async (req, res) => {
  const { committeeId, amount } = req.body;
  if (!committeeId || typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ message: "committeeId and a positive amount are required" });
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
    // determine due date: use committee.paymentDueDay if available
    let dueDate;
    if (req.body.dueDate) {
      dueDate = new Date(req.body.dueDate);
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = Math.min(Math.max(1, committee.paymentDueDay || 1), 28);
      dueDate = new Date(year, month, day, 23, 59, 59);
    }
    const paidAt = contrib.date || new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLate = Math.ceil((paidAt - dueDate) / msPerDay);
    // apply credit score update based on lateness
    try {
      await creditService.applyPaymentEvent(req.user._id, daysLate);
    } catch (e) {
      console.error("Credit update failed", e.message || e);
    }
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
    // populate members and include creditScore for selection
    const committee = await Committee.findById(req.params.id).populate(
      "members",
      "name email creditScore",
    );
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (
      !committee.admin.equals(req.user._id) &&
      !["admin", "superadmin"].includes(req.user.role)
    )
      return res.status(403).json({
        message: "Only committee admin or global admin can run payout",
      });
    const members = committee.members;
    if (!members || members.length === 0)
      return res.status(400).json({ message: "No members" });
    // choose recipient biased by creditScore while preserving rotation fairness
    const start = committee.rotationIndex % members.length;
    const rotated = [];
    for (let i = 0; i < members.length; i++)
      rotated.push(members[(start + i) % members.length]);
    // pick member with highest creditScore in rotated order (stable)
    let bestIdx = 0;
    let bestScore = Number(rotated[0].creditScore || 0);
    for (let i = 1; i < rotated.length; i++) {
      const s = Number(rotated[i].creditScore || 0);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    const recipient = rotated[bestIdx];
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
    // advance rotationIndex to the position after chosen recipient
    committee.rotationIndex = (start + bestIdx + 1) % members.length;
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
