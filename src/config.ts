import * as dotenv from "dotenv";
dotenv.config();

export const url = process.env.WEBSITE_URL;

export const DEBUG = process.env.DEBUG ? /true/i.test(process.env.DEBUG) : false;

export const subDomain = process.env.SUB_DOMAIN;

export const PORT = 6001;

// Database Parameters
export const dbSchema = process.env.DATABASE_SCHEMA;
export const dbUsername = process.env.DATABASE_USERNAME;
export const dbPassword = process.env.DATABASE_PASSWORD;
export const dbHost = process.env.DATABASE_HOST;

export const payment = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '#STRIPE_SECRET_KEY#'
  }
}

/**
 * Google: https://cloud.google.com/console/project
 * Facebook: https://developers.facebook.com
 */
export const auth = {
  jwt: {
    secret: process.env.JWT_SECRET
  },
  redirectURL: {
    login: '/',
    verification: '/',
  },
  facebook: {
    id: process.env.FACEBOOK_APP_ID,
    secret: process.env.FACEBOOK_APP_SECRET,
    returnURL: `${url}/login/facebook/return`,
  },
  google: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
    returnURL: `${url}/login/google/return`,
  }
};