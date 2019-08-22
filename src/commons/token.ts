import { Request } from 'express';
import jwt from 'jsonwebtoken'

import TokenData, { DataStoredInToken } from './token.interface';

import { auth } from './../config';

class Token {

  /**
   * Creating a valid token string by user id.
   * 
   * @param id User ID.
   */
  public static create(id: string): TokenData {
    const expiresIn = 60 * 60 * 24 * 180; // 180 days
    const dataStoredInToken: DataStoredInToken = { id };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, auth.jwt.secret, { expiresIn })
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