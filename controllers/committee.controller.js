const Committee = require("../models/committee.model");
const User = require("../models/user.model");
const Contribution = require("../models/contribution.model");

exports.createCommittee = async (req, res) => {
  const { name, description, amountPerCycle, paymentDueDay } = req.body;
  if (!name)
    return res.status(400).json({ message: "Committee name is required" });
  try {
    const committee = new Committee({
      name,
      description,
      amountPerCycle: amountPerCycle || 0,
      paymentDueDay: Math.min(Math.max(1, paymentDueDay || 1), 28),
      admin: req.user._id,
      members: [req.user._id],
    });
    await committee.save();
    req.user.committees.push(committee._id);
    await req.user.save();
    res.status(201).json(committee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listCommittees = async (req, res) => {
  try {
    const committees = await Committee.find()
      .populate("admin", "name email")
      .populate("members", "name email");
    res.json(committees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCommittee = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id)
      .populate("admin", "name email")
      .populate("members", "name email creditScore");
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    res.json(committee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.joinCommittee = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (committee.members.includes(req.user._id))
      return res.status(400).json({ message: "Already a member" });
    committee.members.push(req.user._id);
    await committee.save();
    req.user.committees.push(committee._id);
    await req.user.save();
    res.json({ message: "Joined committee" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listMembers = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id).populate(
      "members",
      "name email creditScore",
    );
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    res.json(committee.members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update committee — only the committee admin or global admin/superadmin
exports.updateCommittee = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (
      !committee.admin.equals(req.user._id) &&
      !["admin", "superadmin"].includes(req.user.role)
    )
      return res.status(403).json({ message: "Only committee admin can update" });

    const { name, description, amountPerCycle, paymentDueDay } = req.body;
    if (name !== undefined) committee.name = name;
    if (description !== undefined) committee.description = description;
    if (amountPerCycle !== undefined) committee.amountPerCycle = amountPerCycle;
    if (paymentDueDay !== undefined)
      committee.paymentDueDay = Math.min(Math.max(1, paymentDueDay), 28);

    await committee.save();
    res.json(committee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Leave committee — any member except the committee admin
exports.leaveCommittee = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (committee.admin.equals(req.user._id))
      return res.status(400).json({
        message: "Committee admin cannot leave. Delete the committee or transfer ownership first.",
      });
    if (!committee.members.includes(req.user._id))
      return res.status(400).json({ message: "Not a member of this committee" });

    committee.members.pull(req.user._id);
    await committee.save();
    req.user.committees.pull(committee._id);
    await req.user.save();
    res.json({ message: "Left committee" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove a member — committee admin or global admin/superadmin
exports.removeMember = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (
      !committee.admin.equals(req.user._id) &&
      !["admin", "superadmin"].includes(req.user.role)
    )
      return res.status(403).json({ message: "Only committee admin can remove members" });

    const { userId } = req.params;
    if (committee.admin.equals(userId))
      return res.status(400).json({ message: "Cannot remove the committee admin" });
    if (!committee.members.includes(userId))
      return res.status(404).json({ message: "User is not a member" });

    committee.members.pull(userId);
    await committee.save();
    await User.findByIdAndUpdate(userId, { $pull: { committees: committee._id } });
    res.json({ message: "Member removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete committee — committee admin or global admin/superadmin
exports.deleteCommittee = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    if (
      !committee.admin.equals(req.user._id) &&
      !["admin", "superadmin"].includes(req.user.role)
    )
      return res.status(403).json({ message: "Only committee admin can delete" });

    await User.updateMany(
      { committees: committee._id },
      { $pull: { committees: committee._id } },
    );
    await Contribution.deleteMany({ committee: committee._id });
    await Committee.deleteOne({ _id: committee._id });
    res.json({ message: "Committee deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
