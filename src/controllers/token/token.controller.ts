import { Request } from 'express';
import jwt from 'jsonwebtoken'
import TokenData, { DataStoredInToken } from './token.interface';
import IUser from '../users/user.interface'

class TokenController {

  public createToken(user: IUser): TokenData {
    const expiresIn = 60 * 60; // an hour
    const secret:string = process.env.JWT_SECRET || 'Spacenow';
    const dataStoredInToken: DataStoredInToken = {
      id: user.id,
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn })
    }
  }

  public getToken(request: Request): string {
    console.log("AUTHORIZATION TOKEN ", request.headers)
    console.log("COOKIE ", request.cookies.id_token)
    if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
      return request.headers.authorization.split(' ')[1];
    } else if (request.query && request.query.token) {
      return request.query.token;
    } else if (request.cookies && request.cookies.authorization) {
      return request.cookies.authorization;
    }
    return '';
  }

}
 
export default TokenController