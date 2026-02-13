const Committee = require("../models/committee.model");
const User = require("../models/user.model");

exports.createCommittee = async (req, res) => {
  const { name, description, amountPerCycle } = req.body;
  try {
    const committee = new Committee({
      name,
      description,
      amountPerCycle,
      admin: req.user._id,
      members: [req.user._id],
    });
    await committee.save();
    // add committee to user's list
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
      .populate("members", "name email");
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
      "name email",
    );
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });
    res.json(committee.members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
