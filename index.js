process.env.DOTENV_DISABLE_LOGS = "true";
require("dotenv").config();

const express = require("express");
const expressSession = require("express-session");
const cookies = require("cookie-parser");
const request = require("undici").request;

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "your_secret_key";
const path = require("path");

//moongoose setup
const mongoose = require("mongoose");
const userDB = require("./schemas/user");

// Utility functions
const genToken = require("./functions/token");
const discordOauth = require("./functions/discordOauth");

// Middleware setup
app.use(cookies());
app.use(
  expressSession({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("trust proxy", 1); // Trust Cloudflare's proxy

// Import routes
const membersRoute = require("./routes/members");
app.use("/members", membersRoute);
const apiRoute = require("./routes/api");
app.use("/api", apiRoute);

// Routes
app.get("/", async (req, res) => {
  const { cookie } = req.query;
  if (cookie === "required") {
    res.render("index", { cookie: true });
    return;
  }
  res.render("index", { cookie: false });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/apply", (req, res) => {
  res.redirect("https://discord.gg/uE8KQ6f5Xa");
});

app.get("/gallery", (req, res) => {
  res.render("gallery");
});

app.get("/contact", (req, res) => {
  res.redirect("https://discord.com/users/776606148245454915");
});

app.get("/o-auth", async (req, res) => {
  if (req.query.code) {
    const { discordID, discordToken, email, clan } = await discordOauth(
      req.query.code
    ).catch((err) => {
      console.log("Error during Discord OAuth:", err);
      return res.redirect("/o-auth"); // Redirect to start OAuth again, most errors are because people reuse codes

    });
    if (!discordID) {
      return res.redirect("/o-auth"); // Redirect to start OAuth again
    }
    await userDB.findOne({ discordID }).then(async (user) => {
      if (!user) {
        const token = await genToken(discordID);
        user = await new userDB({
          _id: new mongoose.Types.ObjectId(),
          token: token,
          discordID: discordID,
          discordToken: discordToken,
          email: email,
          clan: clan,
        });
        await user.save();
      } else {
        // When user accounts are created, discordID is set to its token value
        // This checks if the token is still the discordID and updates it if so with a few more checks
        if (user.token === discordID || !user.token || user.token.length < 20) {
          user.token = await genToken(discordID);
        }
        user.discordToken = discordToken;
        user.email = email;
        user.clan = clan;
        await user.save();
      }
      // Set session and cookie
      req.session.token = user.token;
      const maxAgeInMilliseconds = 400 * 24 * 60 * 60 * 1000;
      res.cookie("token", user.token, {
        maxAge: maxAgeInMilliseconds,
        httpOnly: true,
        sameSite: "strict",
        secure: false, // Set to true in production using HTTPS
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      return res.redirect("/members");
    });
  } else {
    res.redirect(
      `https://discord.com/oauth2/authorize?client_id=1190867838735483022&response_type=code&redirect_uri=https%3A%2F%2Fprojectblackrose.org%2Fo-auth%2F&scope=identify+guilds+email`
    );
  }
});

//templogin route for testing without discord access due to school computer restrictions.
app.get("/templogin", (req, res) => {
  res.render("temp-login");
});
app.post("/templogin", async (req, res) => {
  const { token } = req.body;
  if (!token || token.length < 20) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
  const user = await userDB.findOne({ token }).catch((err) => {
    console.log("Database error during templogin:", err);
    return null;
  });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  req.session.token = user.token;
  const maxAgeInMilliseconds = 400 * 24 * 60 * 60 * 1000;
  res.cookie("token", user.token, {
    maxAge: maxAgeInMilliseconds,
    httpOnly: true,
    sameSite: "strict",
    secure: false, // Set to true in production using HTTPS
  });
  return res.json({ success: true, message: "Logged in successfully" });
});

//NotFound route
app.use((req, res) => {
  res.status(404).render("not-found");
});

// Database connection and server start
(async () => {
  mongoose.connect("mongodb://pi:27017/pbr").catch(console.error);
})();

app.listen(PORT, async () => {
  console.log(`Server is running locally on http://localhost:${PORT}`);
  const test = await request("https://projectblackrose.org/api/ping");
  if (test.statusCode === 200) {
    console.log("Server is reachable from the internet.");
  }
});
