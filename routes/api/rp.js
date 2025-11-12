const router = require("express").Router();

const Roleplay = require("../../schemas/roleplays");

router.post("/add-player", async (req, res) => {
  const { rpId, playerName, playerRole } = req.body;
  try {
    const rp = await Roleplay.findById(rpId);
    if (!rp) {
      return res.status(404).json({ message: "Roleplay not found" });
    }
    let formatedRole;
    if (playerRole === "CIV") formatedRole = "civilians";
    else if (playerRole === "SAFR") formatedRole = "safr";
    else if (playerRole === "LEO") formatedRole = "cops";

    rp.participants.attendance[formatedRole].push(playerName);
    await rp.save();
    res.status(200).json({ message: "Player added successfully" });
  } catch (error) {
    console.error("Error adding player:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/remove-player", async (req, res) => {
  const { rpId, player } = req.body;
  try {
    const rp = await Roleplay.findById(rpId);
    if (!rp) {
      return res.status(404).json({ message: "Roleplay not found" });
    }
    const { civilians, safr, cops } = rp.participants.attendance;
    const { ontime, late } = rp.participants;

    const isOntime =
      Array.isArray(ontime) &&
      ontime.some((entry) => {
        if (typeof entry === "string" || typeof entry === "number")
          return String(entry) === String(player);
        if (entry && typeof entry === "object")
          return (
            entry.userId === player || String(entry.userId) === String(player)
          );
        return false;
      });
    const isLate =
      Array.isArray(late) &&
      late.some((entry) => {
        if (typeof entry === "string" || typeof entry === "number")
          return String(entry) === String(player);
        if (entry && typeof entry === "object")
          return (
            entry.userId === player || String(entry.userId) === String(player)
          );
        return false;
      });

    if (isOntime || isLate) {
      return res.status(400).json({ message: "Cannot remove server member" });
    }
    rp.participants.attendance.civilians = civilians.filter(
      (p) => p !== player
    );
    rp.participants.attendance.safr = safr.filter((p) => p !== player);
    rp.participants.attendance.cops = cops.filter((p) => p !== player);
    await rp.save();
    res.status(200).json({ message: "Player removed successfully" });
  } catch (error) {
    console.error("Error removing player:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/update-player-role", async (req, res) => {
  let { rpId, player, oldRole, newRole } = req.body;

  try {
    const rp = await Roleplay.findById(rpId);
    if (!rp) {
      return res.status(404).json({ message: "Roleplay not found" });
    }
    const validRoles = ["cops", "civilians", "safr"];
    if (oldRole === "LEO") oldRole = "cops";
    else if (oldRole === "CIV") oldRole = "civilians";
    else if (oldRole === "SAFR") oldRole = "safr";
    if (newRole === "LEO") newRole = "cops";
    else if (newRole === "CIV") newRole = "civilians";
    else if (newRole === "SAFR") newRole = "safr";
    if (oldRole && validRoles.includes(oldRole)) {
      rp.participants.attendance[oldRole] = rp.participants.attendance[
        oldRole
      ].filter((p) => p !== player);
    }
    rp.participants.attendance[newRole].push(player);
    await rp.save();
    res.status(200).json({ message: "Player role updated successfully" });
  } catch (error) {
    console.error("Error updating player role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/endRP", async (req, res) => {
  const { id } = req.body;
  try {
    const rp = await Roleplay.findById(id);
    if (!rp) {
      return res.status(404).json({ message: "Roleplay not found" });
    }
    rp.status = "completed";
    await rp.save();
    res.status(200).json({ message: "Roleplay ended successfully" });
  } catch (error) {
    console.error("Error ending roleplay:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
