import * as dotenv from "dotenv";
dotenv.config();

export const webSiteUrl = process.env.WEBSITE_URL || 'http://localhost:3001';

export const appUrl = process.env.NEW_LISTING_PROCESS_HOST || 'https://localhost:3003';

export const DEBUG = process.env.DEBUG ? /true/i.test(process.env.DEBUG) : false;

export const subDomain = process.env.SUB_DOMAIN;

export const PORT = 6001;

// Database Parameters
export const dbSchema = process.env.DATABASE_SCHEMA;
export const dbUsername = process.env.DATABASE_USERNAME;
export const dbPassword = process.env.DATABASE_PASSWORD;
export const dbHost = process.env.DATABASE_HOST;

// S3 Bucket
export const bucket = process.env.S3_BUCKET || "sandpit-spacenow-images";

/**
 * Google: https://cloud.google.com/console/project
 * Facebook: https://developers.facebook.com
 */
export const auth = {
  jwt: {
    secret: process.env.JWT_SECRET || "Spacenow"
  },
  redirectURL: {
    login: process.env.WEBSITE_URL || "/",
    verification: process.env.WEBSITE_URL || "/"
  },
  facebook: {
    id: process.env.FACEBOOK_APP_ID || "",
    secret: process.env.FACEBOOK_APP_SECRET || "",
    returnURL: `${process.env.USERS_API_HOST}/login/facebook/return`
  }
};

export const apiEmails = process.env.EMAILS_API || "http://localhost:6010";
export const apiSpaces = process.env.SPACES_API_HOST || "http://localhost:6002"
