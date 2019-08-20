import { Router, Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from 'passport';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';

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
    this.initializeRoutes();
    this.initializeOauthStrategies();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/signin`, this.signin);
    this.router.post(`${this.path}/signup`, this.signup);
    this.router.post(`${this.path}/adminSignin`, this.adminSignin);
    this.router.post(`${this.path}/token/validate`, this.tokenValidate);
    this.router.post(`${this.path}/token/adminValidate`, this.tokenAdminValidate);
    this.router.get(`${this.path}/signin/google`, this.googleSignin);
    this.router.get(`/login/google/return`, this.googleReturnMiddleware, this.googleReturn);
  }

  private initializeOauthStrategies() {
    /**
     * Google Strategy.
     */
    passport.use(new GoogleStrategy({
      clientID: auth.google.id,
      clientSecret: auth.google.secret,
      callbackURL: `${auth.google.returnURL}`,
      passReqToCallback: true
    }, (req: Request, accessToken: any, refreshToken: any, profile: any, done: any) => {
      const _ = async () => {
        if (req.user) {
          await UserVerifiedInfoLegacy.update({ isGoogleConnected: true }, { where: { userId: req.user.id } });
          done(null, { type: 'verification' });
        } else {
          const email = (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : profile.email;
          const userData = await UserLegacy.findOne({ where: { email }, attributes: ['id', 'email', 'userBanStatus'] });
          if (userData) {
            if (userData.userBanStatus == 1) {
              return done(null, { id: userData.id, email: userData.email, type: 'userbanned' });
            } else {
              // There is an account associated with this email...
              await UserVerifiedInfoLegacy.update({ isGoogleConnected: true }, { where: { userId: userData.id } });
              return done(null, { id: userData.id, email: userData.email, type: 'login' });
            }
          } else {
            return done(null);
          }
        }
      };
      _().catch(done);
    }));
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

  private tokenValidate = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const secret: string = auth.jwt.secret;
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
        res.cookie('referURL', referURL, { maxAge: 1000 * 60 * 60, domain: subDomain });
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
      if (referURL) {
        res.redirect(referURL);
      } else {
        if (type === 'verification') {
          res.redirect(auth.redirectURL.verification);
        } else {
          const userObj = await UserLegacy.findOne({ where: { id: req.user.id } });
          if (userObj) {
            res.send(Token.create(req.user.id));
          } else {
            next(new WrongCredentialsException());
          }
        }
      }
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }
}

export default AuthenticationController;
