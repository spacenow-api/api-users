import { Sequelize } from 'sequelize-typescript';
import * as config from '../config';
import { Role } from './role.model';
import { User } from './user.model';

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
  Role,
  User
])

export { Role } from './role.model';
export { User } from './user.model';