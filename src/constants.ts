import dotenv from 'dotenv';

// Load the .env file
dotenv.config();

// Get the URL from the .env file
export const audiobookBayUrl = process.env.AUDIOBOOK_BAY_URL;