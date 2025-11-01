const { request } = require("undici");

const chalk = require("chalk");

async function discordOauth(code) {
    try {
      const redirectURI = process.env.NODE_ENV === "development"
        ? "http://localhost:3000/o-auth/"
        : "https://projectblackrose.org/o-auth/";
        const tokenResponseData = await request(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: process.env.clientId,
          client_secret: process.env.clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectURI,
          scope: "identify email guilds",
        }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
     const tokenResponse = await tokenResponseData.body.json();

     const userResponseData = await request(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `${tokenResponse.token_type} ${tokenResponse.access_token}`,
        },
      }
    );
    const userResponse = await userResponseData.body.json();
    
    const discordID = userResponse.id;
    const email = userResponse.email;
    const discordToken = [
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      Date.now() + tokenResponse.expires_in * 1000,
    ];
    const clan = userResponse.clan.identity_guild_id;

    if (!discordID) {
      throw new Error("No Discord ID found in user response, authentication failed.");
    }
    return { discordID, discordToken, email, clan };
    } catch (error) {
        console.log(chalk.red("Error during Discord OAuth:"), error);
        return false;
    }
}

module.exports = discordOauth;