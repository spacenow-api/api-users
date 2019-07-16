import { NextFunction, Response, Request } from 'express';
import jwt from 'jsonwebtoken';

import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';

import { Token } from "../../commons";

async function authMiddleware(req: Request, _: Response, next: NextFunction) {
  const token = Token.get(req);
  if (token) {
    const secret: string = process.env.JWT_SECRET || 'Spacenow';
    try {
      await jwt.verify(token, secret);
      next();
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}

export default authMiddleware;