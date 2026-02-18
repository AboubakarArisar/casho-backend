const User = require("../models/user.model");

// Compute credit delta based on days late (integer days).
// daysLate <= 0 => on-time or early (reward)
// daysLate > 0 => penalty increasing with days late
function computeDelta(daysLate) {
  if (daysLate <= 0) {
    // reward small boost for on-time/early payments
    return 2; // +2 points
  }
  // penalties grow with days late; simple tiers
  if (daysLate <= 3) return -5;
  if (daysLate <= 7) return -10;
  if (daysLate <= 30) return -20;
  // very late -> heavier penalty but capped
  return -30 - Math.min(70, Math.floor((daysLate - 30) / 7));
}

// Update user's credit score for a payment event
// userId: ObjectId/string, daysLate: number
async function applyPaymentEvent(userId, daysLate) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const delta = computeDelta(daysLate);
  const old = Number(user.creditScore || 0);
  let updated = old + delta;
  if (updated > 100) updated = 100;
  if (updated < 0) updated = 0;
  user.creditScore = updated;
  await user.save();
  return { old, updated, delta };
}

module.exports = {
  computeDelta,
  applyPaymentEvent,
};
