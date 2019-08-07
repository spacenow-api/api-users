import { NextFunction, Response, Request } from 'express';
import jwt from 'jsonwebtoken';

import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';

import { UserLegancy } from "../../models";

import { Token } from "../../commons";

const fetchUserById = async (id: string): Promise<string> => {
  const user = await UserLegancy.findOne({ where: { id } });
  if (user) {
    return Promise.resolve(user.email);
  }
  return Promise.reject();
}

async function authMiddleware(req: Request, _: Response, next: NextFunction) {
  const token = Token.get(req);
  if (token && token !== 'undefined') {
    const secret: string = process.env.JWT_SECRET || 'Spacenow';
    try {
      const { id }: any = await jwt.verify(token, secret);
      const email: string = await fetchUserById(id);
      console.debug(`User ${email} verified.`);
      req.userIdDecoded = id;
      next();
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}

export default authMiddleware;