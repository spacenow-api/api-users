import { Request } from 'express';
import jwt from 'jsonwebtoken'

import TokenData, { DataStoredInToken } from './token.interface';

import { AbstractUser } from '../controllers/users/user.interface'

class Token {

  public static create(user: AbstractUser): TokenData {
    const expiresIn = 60 * 60; // an hour
    const secret: string = process.env.JWT_SECRET || 'Spacenow';
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn })
    }
  }

  public static get(req: Request): string {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies.authorization) {
      return req.cookies.authorization;
    }
    return '';
  }
}

export default Token