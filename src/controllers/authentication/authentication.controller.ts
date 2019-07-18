import { Router, Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';

import UserWithThatEmailAlreadyExistsException from "../../helpers/exceptions/UserWithThatEmailAlreadyExistsException";
import WrongCredentialsException from "../../helpers/exceptions/WrongCredentialsException";
import PasswordMatchException from "../../helpers/exceptions/PasswordMatchException";

import { Token } from "../../commons";

import { AbstractUser } from "../users/user.interface";

import { UserLegancy } from "../../models";

class AuthenticationController {

  private path = "/auth";

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    // For now, only using signIn endpoint and work with register on Legancy application. [Arthemus]
    // this.router.post(`${this.path}/register`, this.register);
    this.router.post(`${this.path}/signin`, this.signin);
    this.router.post(`${this.path}/token/validate`, this.tokenValidate);
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    const userData: AbstractUser = req.body;
    const user = await UserLegancy.findOne({ where: { email: userData.email } });
    if (user) {
      next(new UserWithThatEmailAlreadyExistsException(userData.email));
    } else {
      await UserLegancy.create(userData);
      const tokenData = Token.create(userData);
      res.send(tokenData);
    }
  };

  private signin = async (req: Request, res: Response, next: NextFunction) => {
    const logInData: AbstractUser = req.body;
    const userObj = await UserLegancy.findOne({ where: { email: logInData.email } });
    if (userObj) {
      const isPasswordMatching = await bcryptjs.compare(logInData.password, userObj.password);
      if (isPasswordMatching) {
        const tokenData = Token.create(userObj);
        res.send(tokenData);
      } else next(new PasswordMatchException());
    } else next(new WrongCredentialsException());
  };

  private tokenValidate = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Token API Validation');
    const data = req.body;
    console.log(data.token);
    const secret: string = process.env.JWT_SECRET || 'Spacenow';
    try {
      await jwt.verify(data.token, secret);
      res.status(200).send('OK');
    } catch (err) {
      res.status(200).send('EXPIRED');
    }
  }
}

export default AuthenticationController;
