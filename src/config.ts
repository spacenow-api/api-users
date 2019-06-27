import * as dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6001;

// Database Parameters
export const dbSchema = process.env.DATABASE_SCHEMA || 'spacenow_2019';
export const dbUsername = process.env.DATABASE_USERNAME || 'spacenowtest';
export const dbPassword = process.env.DATABASE_PASSWORD || 'Spac.918273!';
export const dbHost =
	process.env.DATABASE_HOST ||
	'spacenow-test.cjo4zy3wnflc.ap-southeast-2.rds.amazonaws.com';
