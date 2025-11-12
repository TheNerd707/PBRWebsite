const express = require("express");
const router = express.Router();
const Roleplay = require("../schemas/roleplays");
const userDB = require("../schemas/user");

const { EmbedBuilder, WebhookClient } = require("discord.js");

router.get("/activeRPs", async (req, res) => {

  try {
    const activeRPs = await Roleplay.find({
      status: { $in: ["scheduled", "ongoing"] },
    });
    let response = [];
    for (const rp of activeRPs) {
      let rpData = {};
      rpData.hosts = [];
      for (const host of rp.hosts) {
        const user = await fetch(`http://localhost:3010/api/user`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ discordID: host }),
        })
          .then((res) => res.json())
          .catch((err) => {
            null;
          });

        if (user) {
          rpData.hosts.push(user.name);
        } else {
          rpData.hosts.push("Unknown User");
        }
      }
      rpData.location = rp.location;
      rpData.startTime = rp.timestamp;
      rpData.players = {
        leo: rp.participants.attendance.cops.length,
        civ: rp.participants.attendance.civilians.length,
        safr: rp.participants.attendance.safr.length,
        total: rp.participants.ontime.length + rp.participants.late.length,
      };
      rpData.id = rp._id;
      response.push(rpData);
    }
    res.json(response);
  } catch (error) {
    console.error("Error fetching active roleplays:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/webhook", async (req, res) => {
  console.log("Received webhook request");
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  const payload = req.body;

  if (req.headers["x-github-event"] !== "push") {
    return res.sendStatus(200);
  }

  const repo = payload.repository.full_name;
  const pusher = payload.pusher.name;
  const commits = payload.commits
    .map((commit) => `${commit.id.slice(0, 7)}: ${commit.message}`)
    .join("\n");

  try {
    const embed = new EmbedBuilder()
      .setColor("#008000")
      .setTitle("Repository Update")
      .setDescription(`New update to __**${repo}**__ by __**${pusher}**__`)
      .addFields({ name: "Commits:", value: commits || "No commits found" })
      .setTimestamp();
    const webhookClient = new WebhookClient({
      url: DISCORD_WEBHOOK_URL,
    });
    await webhookClient.send({
      embeds: [embed],
    });
    res.sendStatus(200);
  } catch (err) {
    console.error("Failed to post to Discord:", err);
    res.sendStatus(500);
  }
});

router.use("/rp", require("./api/rp"));
module.exports = router;
