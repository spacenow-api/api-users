import * as dotenv from "dotenv";
dotenv.config();

export const DEBUG = process.env.DEBUG ? /true/i.test(process.env.DEBUG) : false;

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6001;

// Database Parameters
export const dbSchema = process.env.DATABASE_SCHEMA;
export const dbUsername = process.env.DATABASE_USERNAME;
export const dbPassword = process.env.DATABASE_PASSWORD;
export const dbHost = process.env.DATABASE_ENDPOINT;

export const payment = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '#STRIPE_SECRET_KEY#'
  }
}
