import { Request, Response, NextFunction } from "express";
import PassportFacebookToken from 'passport-facebook-token';
import passport from 'passport';

import sequelizeErrorMiddleware from '../middlewares/sequelize-error-middleware';
import HttpException from "./../../helpers/exceptions/HttpException";

import { IUserLegacySignUpRequest } from '../../controllers/users/user.interface';
import { AuthenticationService } from '../../services/authentication.service';

import { UserVerifiedInfoLegacy, UserLegacy } from '../../models';

import { Token } from './../../commons';

import { auth } from "../../config";

class FacebookOAuthStrategy {

  public static MIDDLEWARE = passport.authenticate('facebook-token', { failureRedirect: '/login', session: false });

  private authService = new AuthenticationService();

  public static initialize() {
    passport.use(new PassportFacebookToken({
      clientID: auth.facebook.id,
      clientSecret: auth.facebook.secret,
      profileFields: ['name', 'email', 'birthday', 'link', 'locale', 'timezone', 'picture.width(255).height(255)']
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
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
          firstName: gObj.first_name,
          lastName: gObj.last_name,
          password: ''
        };
        const userCreated = await authService.registerNewUser(userObj, 'facebook');
        return done(null, { id: userCreated.id, email: userCreated.email, type: 'login' });
      }
    }));
    return new FacebookOAuthStrategy();
  }

  public validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) throw new HttpException(400, 'Facebook User object is missing.');
      const type = req.user.type;
      const referURL = req.cookies.referURL;
      if (referURL) {
        res.redirect(referURL);
      } else {
        if (type === 'verification') {
          res.redirect(auth.redirectURL.verification);
        } else {
          if (req.query.userType && req.query.userType !== 'null') {
            await UserLegacy.update({ userType: req.query.userType }, { where: { id: req.user.id } })
          }
          const userData = await this.authService.getUserData(req.user.id);
          const tokenData = Token.create(req.user.id);
          res.send({ status: 'OK', ...tokenData, user: userData });
        }
      }
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }
}

export { FacebookOAuthStrategy };