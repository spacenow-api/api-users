import { Sequelize } from 'sequelize-typescript';
import * as config from '../config';

export const sequelize = new Sequelize({
  host: config.dbEndpoint,
  database: config.dbSchema,
  dialect: 'mysql',
  username: config.dbUsername,
  password: config.dbPassword,
  logging: false,
  storage: ':memory:',
  modelPaths: [__dirname + '/*.model.tsx'],
  modelMatch: (filename, member) => {
    console.log("FILENAME ", filename)
    return filename.substring(0, filename.indexOf('.model')) === member.toLowerCase();
  }
});

export { User } from './user.model';