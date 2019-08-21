import { Router, Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import WrongCredentialsException from "../../helpers/exceptions/WrongCredentialsException";
import PasswordMatchException from "../../helpers/exceptions/PasswordMatchException";
import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import { GoogleOAuthStrategy } from './../../helpers/oauth/google';

import { AuthenticationService } from './../../services/authentication.service';

import { DataStoredInToken } from "../../commons/token.interface";
import { Token } from "../../commons";

import { AbstractUser, IUserLegacySignUpRequest } from "../users/user.interface";

import {
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy
} from "../../models";

import { auth } from './../../config';

class AuthenticationController {

  private path = "/auth";

  private router = Router();

  private googleOauth = GoogleOAuthStrategy.initialize();

  private authService = new AuthenticationService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/signin`, this.signin);
    this.router.post(`${this.path}/signup`, this.signup);
    this.router.post(`${this.path}/adminSignin`, this.adminSignin);
    this.router.post(`${this.path}/token/validate`, this.tokenValidate);
    this.router.post(`${this.path}/token/adminValidate`, this.tokenAdminValidate);
    this.router.get(`${this.path}/signin/google`, this.googleOauth.signin);
    this.router.get(`/login/google/return`, GoogleOAuthStrategy.RETURN_MIDDLEWARE, this.googleOauth.return);
  }

  private signin = async (req: Request, res: Response, next: NextFunction) => {
    const logInData: AbstractUser = req.body;
    const userObj = await UserLegacy.findOne({ where: { email: logInData.email } });
    if (userObj) {
      const isPasswordMatching = await bcryptjs.compare(
        logInData.password,
        userObj.password
      );
      if (isPasswordMatching) {
        const tokenData = Token.create(userObj.id);
        res.send(tokenData);
      } else next(new PasswordMatchException());
    } else next(new WrongCredentialsException());
  };

  private adminSignin = async (req: Request, res: Response, next: NextFunction) => {
    const logInData: AbstractUser = req.body;
    const adminObj = await UserLegacy.findOne({ where: { email: logInData.email, role: "admin" } });
    if (adminObj) {
      const isPasswordMatching = await bcryptjs.compare(logInData.password, adminObj.password);
      if (isPasswordMatching) {
        const tokenData = Token.create(adminObj.id);
        res.send(tokenData);
      } else next(new PasswordMatchException());
    } else next(new WrongCredentialsException());
  };

  private tokenValidate = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const decoded = await jwt.verify(data.token, auth.jwt.secret);
      if (decoded) {
        const tokenDecoded = <DataStoredInToken>decoded;
        const userId: string = tokenDecoded.id;
        const userObj = <UserLegacy>(await UserLegacy.findOne({ where: { id: userId }, raw: true }));
        const userProfileObj = <UserProfileLegacy>(await UserProfileLegacy.findOne({ where: { userId }, raw: true }));
        const userVerifiedObj = <UserVerifiedInfoLegacy>(
          await UserVerifiedInfoLegacy.findOne({
            where: { userId },
            raw: true
          })
        );
        res.status(200).send({
          status: "OK",
          user: {
            ...userObj,
            profile: {
              ...userProfileObj
            },
            verification: {
              ...userVerifiedObj
            }
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(200).send({ status: "Expired" });
    }
  };

  private tokenAdminValidate = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const decoded = await jwt.verify(data.token, auth.jwt.secret);
      if (decoded) {
        const tokenDecoded = <DataStoredInToken>decoded;
        const adminId: string = tokenDecoded.id;
        const adminObj = <UserLegacy>await UserLegacy.findOne({
          where: { id: adminId, role: "admin" },
          raw: true
        });
        res.status(200).send({
          status: "OK",
          admin: {
            ...adminObj
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(200).send({ status: "Expired" });
    }
  };

  private signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: IUserLegacySignUpRequest = req.body;
      const userCreated: UserLegacy = await this.authService.registerNewUser(userData);
      res.send(userCreated);
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }
}

export default AuthenticationController;
