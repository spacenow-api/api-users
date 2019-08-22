import { Request, Response, NextFunction } from "express";
import { Strategy } from 'passport-facebook';
import passport from 'passport';

import sequelizeErrorMiddleware from '../middlewares/sequelize-error-middleware';
import WrongCredentialsException from "../exceptions/WrongCredentialsException";

import { IUserLegacySignUpRequest } from '../../controllers/users/user.interface';
import { AuthenticationService } from '../../services/authentication.service';

import { UserVerifiedInfoLegacy, UserLegacy } from '../../models';

import { Token } from "../../commons";
import { auth, subDomain } from "../../config";

class FacebookOAuthStrategy {

  public static RETURN_MIDDLEWARE = passport.authenticate('facebook', { failureRedirect: '/login', session: false });

  public static initialize() {
    passport.use(new Strategy({
      clientID: auth.facebook.id,
      clientSecret: auth.facebook.secret,
      callbackURL: `${auth.facebook.returnURL}`,
      profileFields: ['name', 'email', 'birthday', 'link', 'locale', 'timezone', 'picture.width(255).height(255)'],
      passReqToCallback: true
    }, (req: Request, accessToken: any, refreshToken: any, profile: any, done: any) => {
      const _ = async () => {
        if (req.user) {
          await UserVerifiedInfoLegacy.update({ isFacebookConnected: true }, { where: { userId: req.user.id } });
          done(null, { type: 'verification' });
        } else {
          const email = (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : profile.email;
          const userData = await UserLegacy.findOne({ where: { email }, attributes: ['id', 'email', 'userBanStatus'] });
          if (userData) {
            if (userData.userBanStatus == 1) {
              return done(null, { id: userData.id, email: userData.email, type: 'userbanned' });
            } else {
              // There is an account associated with this email...
              await UserVerifiedInfoLegacy.update({ isFacebookConnected: true }, { where: { userId: userData.id } });
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
    return new FacebookOAuthStrategy();
  }

  public signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referURL = req.query.refer;
      if (referURL)
        res.cookie('referURL', referURL, { maxAge: 1000 * 60 * 60, domain: subDomain });
      passport.authenticate('facebook', {
        scope: ['email', 'user_location', 'user_birthday'],
        session: false
      })(req, res, next);
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  public return = async (req: Request, res: Response, next: NextFunction) => {
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

export { FacebookOAuthStrategy };