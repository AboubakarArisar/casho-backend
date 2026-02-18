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

// Get a user's credit score by id
exports.getUserCredit = async (req, res) => {
  try {
    const id = req.params.id;
    // support 'me' to fetch current user
    const userId = id === 'me' ? req.user._id : id;
    const user = await User.findById(userId).select('name email creditScore');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, creditScore: user.creditScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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

