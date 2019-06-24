import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import RequestWithUser from '../interfaces/requestWithUser.inteface';
import TokenController from '../../token/token.controller';
import { DataStoredInToken } from '../../token/token.interface';
import { User } from '../../models';

async function authMiddleware(request: RequestWithUser, response: Response, next: NextFunction) {
  const token = new TokenController().getToken(request);
  if (token) {
    const secret: string = process.env.JWT_SECRET || 'Spacenow';
    try {
      const verificationResponse:DataStoredInToken = jwt.verify(token, secret) as DataStoredInToken;
      const user = await User.findOne({ where: {id: verificationResponse.id} });
      if (user) {
        request.user = user;
        next();
      } else {
        next(new WrongAuthenticationTokenException());
      }
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}
 
export default authMiddleware;