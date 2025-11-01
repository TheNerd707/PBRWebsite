const crypto = require(`crypto`); // built into node

async function token(discordID) {
    const c = crypto.randomBytes(16).toString("hex");
    const token = discordID + '-' + Date.now().toString(36) + '-' + c;
   return token;
}

module.exports = token;