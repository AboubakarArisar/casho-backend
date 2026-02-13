const User = require("../models/user.model");
const Committee = require("../models/committee.model");

exports.metrics = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const committees = await Committee.countDocuments();
    res.json({ users, committees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listCommittees = async (req, res) => {
  try {
    const committees = await Committee.find().populate("admin", "name email");
    res.json(committees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Promote or change role of a user. Body: { userId, role }
exports.promoteUser = async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role)
    return res.status(400).json({ message: "userId and role required" });
  const allowedRoles = ["user", "admin", "superadmin"];
  if (!allowedRoles.includes(role))
    return res.status(400).json({ message: "Invalid role" });

  try {
    // Only superadmin can assign superadmin
    if (role === "superadmin" && req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Only superadmin can assign superadmin role" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({
      message: "User role updated",
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a committee (global admin action)
exports.deleteCommittee = async (req, res) => {
  const id = req.params.id;
  try {
    const committee = await Committee.findById(id);
    if (!committee)
      return res.status(404).json({ message: "Committee not found" });

    await committee.remove();
    res.json({ message: "Committee deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
