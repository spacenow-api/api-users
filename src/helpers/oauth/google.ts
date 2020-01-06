import { Request, Response, NextFunction } from "express";
import axios from "axios";

import sequelizeErrorMiddleware from "./../middlewares/sequelize-error-middleware";
import HttpException from "./../../helpers/exceptions/HttpException";

import { IUserLegacySignUpRequest } from "./../../controllers/users/user.interface";
import { AuthenticationService } from "./../../services/authentication.service";

import { Token } from "./../../commons";

import { UserLegacy } from "./../../models";

interface IGoogleUserInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: string;
  exp: string;
  jti: string;
  alg: string;
  kid: string;
  typ: string;
}

class GoogleOAuthStrategy {
  private authService = new AuthenticationService();

  public validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const idToken: string = data.token;
      const userType: string = data.userType;
      if (!idToken) throw new HttpException(400, "Google ID Token is missing.");
      const { data: userInfo } = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );
      const userId: string = await this.validOrCreateUser(userInfo);
      if (userType && userType != "null") {
        await UserLegacy.update({ userType }, { where: { id: userId } });
      }
      const userData = await this.authService.getUserData(userId);
      const tokenData = Token.create(userId);
      res.send({ status: "OK", ...tokenData, user: userData });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private validOrCreateUser = async (
    googleUserInfo: IGoogleUserInfo
  ): Promise<string> => {
    const userData = await UserLegacy.findOne({
      where: { email: googleUserInfo.email },
      attributes: ["id", "userBanStatus"]
    });
    if (userData) {
      if (userData.userBanStatus == 1) {
        throw new HttpException(400, "userbanned");
      } else {
        return Promise.resolve(userData.id);
      }
    } else {
      const userObj = <IUserLegacySignUpRequest>{
        email: googleUserInfo.email,
        firstName: googleUserInfo.given_name,
        lastName: googleUserInfo.family_name
      };
      const userCreated = await this.authService.registerNewUser(
        userObj,
        "google"
      );
      return Promise.resolve(userCreated.id);
    }
  };
}

export { GoogleOAuthStrategy };
