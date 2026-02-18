const mongoose = require("mongoose");

const CommitteeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    amountPerCycle: { type: Number, default: 0 },
    rotationIndex: { type: Number, default: 0 },
    // day of month payments are due (1-28). Used to compute lateness.
    paymentDueDay: { type: Number, default: 1 },
    // keep payouts simple for simulation
    payouts: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amount: Number,
        date: Date,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Committee", CommitteeSchema);
