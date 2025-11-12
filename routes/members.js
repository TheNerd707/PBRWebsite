const router = require("express").Router();
const { request } = require("undici");
const userDB = require("../schemas/user");
const Roleplay = require("../schemas/roleplays");

async function getRoleplayData(rpId) {
    try {
        const rp = await Roleplay.findById(rpId);
        if (!rp) {
            return null;
        }
        return rp;
    } catch (err) {
        console.log("Error fetching roleplay data:", err);
        return null;
    }
}

async function getUserDataFromBot(discordID) {
    try {
        const userResponseData = await request("http://localhost:3010/api/user", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ discordID }),
        });
        return await userResponseData.body.json();
    } catch (err) {
        console.log("Error fetching user data:", err);
        return null;
    }
}

router.get("/", async (req, res) => {
  const cCookie = req.cookies.cookieConsent;
  if (cCookie !== "accepted") {
    return res.redirect("/?cookie=required");
  }
  const token = req.session.token || req.cookies.token;
  if (!token || token === "undefined" || token.length < 20) {
    return res.redirect("/o-auth");
  }
  const user = await userDB.findOne({ token });
  if (!user) {
    return res.redirect("/o-auth");
  }
  res.redirect(`/members/landing`);
});

router.get("/landing", async (req, res) => {
  const token = req.session.token || req.cookies.token;
  if (!token || token === "undefined" || token.length < 20) {
    return res.redirect("/members");
  }
  let user = await userDB.findOne({ token });
  if (!user) {
    return res.redirect("/members");
  }

const userData = await getUserDataFromBot(user.discordID);
if (!userData || userData.status === "u") {
    return res.redirect("/notMember");
}
let clan = user.clan === '1194127476536905838';
const updatedUser = {
    discordID: user.discordID,
    email: user.email,
    name: userData.name,
    avatar: userData.avatar,
    status: userData.status,
    clan: clan,
};
  res.render("landing", { user: updatedUser });
});

router.get("/staff", async (req, res) => {
  const token = req.session.token || req.cookies.token;
  if (!token || token === "undefined" || token.length < 20) {
    return res.redirect("/members");
  }
  let user = await userDB.findOne({ token });
  if (!user) {
    return res.redirect("/members");
  }

  const userData = await getUserDataFromBot(user.discordID);
  if (!userData || userData.status === "u") {
    return res.redirect("/notMember");
  }
  let clan = user.clan === '1194127476536905838';
  const updatedUser = {
    discordID: user.discordID,
    email: user.email,
    name: userData.name,
    avatar: userData.avatar,
    status: userData.status,
    clan: clan,
  };
  if (req.isComputer) { 
  res.render("staff", { user: updatedUser });
  return;
  }
  res.render("mobile/staff", { user: updatedUser });
});

router.get("/roleplay/:id", async (req, res) => {
  const token = req.session.token || req.cookies.token;
  if (!token || token === "undefined" || token.length < 20) {
    return res.redirect("/members");
  }

  const user = await userDB.findOne({ token });
  if (!user) {
    return res.redirect("/members");
  }

  const userData = await getUserDataFromBot(user.discordID);
  if (!userData || userData.status === "u") {
    return res.redirect("/notMember");
  }
  if (userData.status !== "s" && userData.status !== "a") {
    return res.redirect("/members");
  }

  const rpId = req.params.id;
  const rpData = await getRoleplayData(rpId);
  if (!rpData) {
    return res.redirect("/notFound");
  }
  const updatedUser = {
    discordID: user.discordID,
    email: user.email,
    name: userData.name,
    avatar: userData.avatar,
    status: userData.status,
    clan: user.clan === '1194127476536905838',
  };
  rpData.hostNames = [];
  for (const hostId of rpData.hosts) {
    const user = await fetch(`http://localhost:3010/api/user`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ discordID: hostId }),
    }).then(res => res.json()).catch(err => { null });

    if (user) {
      rpData.hostNames.push(user.name);
    }
  }
  const people = {};
  for (const ontime of rpData.participants.ontime) {
    const participantData = await getUserDataFromBot(ontime);
    if (participantData) {
      people[ontime] = participantData.name;
    }
  }
  for (const late of rpData.participants.late) {
    const participantData = await getUserDataFromBot(late.userId);
    if (participantData) {
      people[late.userId] = participantData.name;
    }
  }
  if (req.isComputer) { 
    return res.render("roleplay", { rp: rpData, user: updatedUser, people });
  }
  res.render("mobile/roleplay", { rp: rpData, user: updatedUser, people });
});

module.exports = router;
