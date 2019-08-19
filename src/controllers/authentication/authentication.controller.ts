import { Router, Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from 'passport';

import UserWithThatEmailAlreadyExistsException from "../../helpers/exceptions/UserWithThatEmailAlreadyExistsException";
import WrongCredentialsException from "../../helpers/exceptions/WrongCredentialsException";
import PasswordMatchException from "../../helpers/exceptions/PasswordMatchException";
import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";

import { DataStoredInToken } from "../../commons/token.interface";
import { Token } from "../../commons";

import { AbstractUser, IUserLegacySignUpRequest } from "../users/user.interface";

import {
  UserLegacy,
  AdminUserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy,
  EmailTokenLegacy
} from "../../models";

import { subDomain, auth } from './../../config';

class AuthenticationController {
  private path = "/auth";

  private router = Router();

  private googleReturnMiddleware = passport.authenticate('google', { failureRedirect: '/login', session: false });

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.post(`${this.path}/signin`, this.signin);
    this.router.post(`${this.path}/signin/google`, this.googleSignin);
    this.router.post(`${this.path}/signin/google/return`, this.googleReturnMiddleware, this.googleReturn);
    this.router.post(`${this.path}/signup`, this.signup);
    this.router.post(`${this.path}/adminSignin`, this.adminSignin);
    this.router.post(`${this.path}/token/validate`, this.tokenValidate);
    this.router.post(`${this.path}/token/adminValidate`, this.tokenAdminValidate);
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
        const tokenData = Token.create(userObj);
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
        const tokenData = Token.create(adminObj);
        res.send(tokenData);
      } else next(new PasswordMatchException());
    } else next(new WrongCredentialsException());
  };

  private tokenValidate = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const secret: string = process.env.JWT_SECRET || "Spacenow";
    try {
      const decoded = await jwt.verify(data.token, secret);
      if (decoded) {
        const tokenDecoded = <DataStoredInToken>decoded;
        const userId: string = tokenDecoded.id;
        const userObj = <UserLegacy>(
          await UserLegacy.findOne({ where: { id: userId }, raw: true })
        );
        const userProfileObj = <UserProfileLegacy>(
          await UserProfileLegacy.findOne({ where: { userId }, raw: true })
        );
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

  private tokenAdminValidate = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const secret: string = process.env.JWT_SECRET || "Spacenow";
    try {
      const decoded = await jwt.verify(data.token, secret);
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
      const email = userData.email;
      if (await UserLegacy.count({ where: { email } }) > 0) {
        next(new UserWithThatEmailAlreadyExistsException(email));
      } else if (await AdminUserLegacy.count({ where: { email } }) > 0) {
        next(new UserWithThatEmailAlreadyExistsException(email));
      } else {
        const updatedFirstName = this.capitalizeFirstLetter(userData.firstName);
        const updatedLastName = this.capitalizeFirstLetter(userData.lastName);
        const userCreated: UserLegacy = await UserLegacy.create({
          email,
          password: userData.password,
          emailConfirmed: true,
          type: 'email'
        });
        await UserProfileLegacy.create({
          userId: userCreated.id,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          displayName: `${updatedFirstName} ${updatedLastName}`
        });
        await UserVerifiedInfoLegacy.create({ userId: userCreated.id });
        const emailToken = Date.now();
        await EmailTokenLegacy.create({ email, userId: userCreated.id, token: emailToken });
        /* Wating Authentication project. [Arthemus] */
        // const tokenData = Token.create(userCreated);
        // res.cookie('id_token', tokenData.token, { maxAge: 1000 * tokenData.expiresIn, domain: subDomain })
        res.send({ emailToken });
      }
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private capitalizeFirstLetter(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private googleSignin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referURL = req.query.refer;
      if (referURL) {
        const expiresIn = 60 * 60;
        res.cookie('referURL', referURL, { maxAge: 1000 * expiresIn, domain: subDomain });
      }
      passport.authenticate('google', {
        scope: [
          'https://www.googleapis.com/auth/plus.me',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/plus.login',
        ],
        session: false
      })(req, res, next);
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  private googleReturn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.user.type;
      const referURL = req.cookies.referURL;
      const user = {
        id: req.user.id,
        email: req.user.email,
      };
      if (referURL) {
        res.clearCookie("referURL", { domain: subDomain });
        const expiresIn = 60 * 60 * 24 * 180;
        const token = jwt.sign(user, auth.jwt.secret, { expiresIn });
        res.cookie('id_token', token, { maxAge: 1000 * expiresIn, domain: subDomain });
        res.redirect(referURL);
      } else {
        if (type === 'verification') {
          res.redirect(auth.redirectURL.verification);
        } else {
          const expiresIn = 60 * 60 * 24 * 180;
          const token = jwt.sign(user, auth.jwt.secret, { expiresIn });
          res.cookie('id_token', token, { maxAge: 1000 * expiresIn, domain: subDomain });
          res.redirect(auth.redirectURL.login);
        }
      }
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }
}

export default AuthenticationController;
