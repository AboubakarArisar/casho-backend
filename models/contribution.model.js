const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema(
  {
    committee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Committee",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    paidOut: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Contribution", ContributionSchema);
