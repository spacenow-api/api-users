import { IsEmail, Length } from 'sequelize-typescript';

export class Auth {
 
  @IsEmail
  email!: string;

  @Length({min: 8, max: 12})
  password!: string;
 
}