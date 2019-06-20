import { Sequelize } from 'sequelize-typescript';
import * as config from '../config';
import { User } from './user.model'

export const sequelize = new Sequelize({
  host: config.dbEndpoint,
  database: config.dbSchema,
  dialect: 'mysql',
  username: config.dbUsername,
  password: config.dbPassword,
  logging: false,
  storage: ':memory:'
});

sequelize.addModels([
  User
])

export { User } from './user.model';