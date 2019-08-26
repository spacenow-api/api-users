import { Request, Response, NextFunction } from "express";
import { OAuth2Strategy } from 'passport-google-oauth';
import passport from 'passport';

import sequelizeErrorMiddleware from './../middlewares/sequelize-error-middleware';
import WrongCredentialsException from "./../exceptions/WrongCredentialsException";

import { IUserLegacySignUpRequest } from './../../controllers/users/user.interface';
import { AuthenticationService } from './../../services/authentication.service';

import { UserVerifiedInfoLegacy, UserLegacy } from './../../models';

import { Token } from "./../../commons";
import { auth, subDomain } from "./../../config";

class GoogleOAuthStrategy {

  public static MIDDLEWARE = passport.authenticate('google', { failureRedirect: '/login', session: false });

  public static initialize() {
    passport.use(new OAuth2Strategy({
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
            const authService = new AuthenticationService();
            const { _json: gObj } = profile;
            const userObj = <IUserLegacySignUpRequest>{
              email: gObj.email,
              firstName: gObj.given_name,
              lastName: gObj.family_name
            };
            const userCreated = await authService.registerNewUser(userObj);
            return done(null, { id: userCreated.id, email: userCreated.email, type: 'login' });
          }
        }
      };
      _().catch(done);
    }));
    return new GoogleOAuthStrategy();
  }

  public signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referURL = req.query.refer;
      if (referURL)
        res.cookie('referURL', referURL, { maxAge: 1000 * 60 * 60, domain: subDomain });
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

  public validate = async (req: Request, res: Response, next: NextFunction) => {
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

export { GoogleOAuthStrategy };