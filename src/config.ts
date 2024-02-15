import dotenv from "dotenv";
import { AttachmentBuilder } from "discord.js";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
};

export const logoFile = new AttachmentBuilder(`./assets/ABB-Discord.png`).setName('ABB-Discord.png');