import { Router, Request, Response, NextFunction } from "express";
import { differenceInHours } from 'date-fns';

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import HttpException from "../../helpers/exceptions/HttpException";
import errorMiddleware from "../../helpers/middlewares/error-middleware";
import CryptoUtils from './../../helpers/utils/crypto.utils';

import upload from "../../services/image.upload.service";
import EmailService from './../../services/email.service';

import {
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy,
  ForgotPassword
} from "../../models";
import { create } from "domain";

class UserLegacyController {

  private path = "/users/legacy";

  private router = Router();

  private emailService = new EmailService()

  private cryptoUtils = new CryptoUtils();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.getAllUsersLegacy);
    this.router.get(`${this.path}/:id`, this.getUserLegacyById);
    this.router.delete(`${this.path}`, authMiddleware, this.deleteUserByEmail);
    this.router.patch(`${this.path}`, authMiddleware, this.setUserLegacy);
    this.router.patch(`${this.path}/profile`, authMiddleware, this.updateUserProfileLegacy);
    this.router.post(`${this.path}/profile/picture`, authMiddleware, this.updateProfilePicture);
    this.router.post(`${this.path}/password/reset`, this.resetPassword);
    this.router.post(`${this.path}/password/reset/update`, this.resetPasswordUpdate);
  }

  private getUserLegacyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserLegacy.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: UserProfileLegacy,
            as: "profile"
          }
        ]
      });
      res.send(user);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private getAllUsersLegacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserLegacy.findAndCountAll({
        attributes: [
          "id",
          "email",
          "emailConfirmed",
          "role",
          "userBanStatus",
          "provider"
        ],
        include: [
          {
            model: UserProfileLegacy,
            as: "profile"
          },
          {
            model: UserVerifiedInfoLegacy,
            as: "userVerifiedInfo"
          }
        ]
      });
      res.send(users);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private deleteUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.query.email;
      const user = await UserLegacy.findOne({ where: { email: email } });
      if (!user) next(new HttpException(400, "User does not exist!"));
      else
        try {
          await UserLegacy.destroy({ where: { id: user.id } });
          next(new HttpException(200, "User deleted successful!"));
        } catch (error) {
          errorMiddleware(error, req, res, next);
        }
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private setUserLegacy = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    delete data.id;
    try {
      const user = await UserLegacy.findOne({ where: { id: req.query.id } });
      if (!user) next(new HttpException(400, "User does not exist!"));
      else
        try {
          await UserLegacy.update(data, {
            where: { id: req.query.id }
          });
          next(new HttpException(200, "User updated successful!"));
        } catch (error) {
          errorMiddleware(error, req, res, next);
        }
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private updateUserProfileLegacy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { data } = req.body;
    try {
      const user = await UserLegacy.findOne({ where: { id: req.query.id } });
      if (!user) next(new HttpException(400, "User does not exist!"));
      else
        try {
          await UserProfileLegacy.update(data, {
            where: { userId: req.query.id }
          });
          next(new HttpException(200, "User profile updated successful!"));
        } catch (error) {
          errorMiddleware(error, req, res, next);
        }
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private updateProfilePicture = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const user = await UserLegacy.findOne({
        where: { id: request.query.id }
      });
      if (!user) next(new HttpException(400, "User does not exist!"));
      else
        await upload.single("file")(request, response, async error => {
          if (error) {
            console.log("ERROR", error);
            response.send(error);
          } else {
            const file: any = request.file;
            console.log("FILE", file);
            try {
              const toSave = Object.assign({}, { picture: file.Location });
              await UserProfileLegacy.update(toSave, {
                where: { userId: request.query.id }
              });
              next(
                new HttpException(
                  200,
                  "User profile picture updated successful!"
                )
              );
            } catch (error) {
              console.error(error);
              response.send(error);
            }
          }
        });
    } catch (error) {
      console.error(error);
      response.send(error);
    }
  };

  private resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.email) throw new HttpException(400, 'E-mail not found.');
      const userObj = await UserLegacy.findOne({ where: { email: req.body.email } });
      if (!userObj) throw new HttpException(400, `User ${req.body.email} not exist!`);
      await ForgotPassword.destroy({ where: { email: userObj.email, userId: userObj.id } });
      const token = this.cryptoUtils.encrypt(`${userObj.id}#${Date.now()}`);
      await ForgotPassword.create({ userId: userObj.id, email: userObj.email, token });
      this.emailService.send('reset-email', req.body.email, { username: userObj.profile ? userObj.profile.firstName : 'user' }); // #EMAIL
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  private resetPasswordUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.token) throw new HttpException(400, "Token not provided.");
      if (!req.body.password) throw new HttpException(400, "New password not provided.");
      const userIdDecoded: string = await this.resetPasswordTokenValidate(req.body.token);
      const userObj = await UserLegacy.findOne({ where: { id: userIdDecoded } });
      if (!userObj) throw new HttpException(400, `User ${userIdDecoded} not exist!`);
      await ForgotPassword.destroy({ where: { userId: userIdDecoded } });
      await UserLegacy.update({ password: UserLegacy.getPasswordHash(req.body.password) }, { where: { id: userIdDecoded } });
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  private resetPasswordTokenValidate = async (token: string): Promise<string> => {
    const userId: string = this.cryptoUtils.decrypt(token).split('#')[0];
    const forgotRecord: ForgotPassword | null = await ForgotPassword.findOne({ where: { userId, token } });
    if (forgotRecord) {
      if (differenceInHours(forgotRecord.createdAt!, new Date()) > 1) {
        throw new HttpException(400, 'Forgot password token has been expired.');
      }
      return userId;
    }
    throw new HttpException(400, `User does not have a forgot password register!`);
  }
}

export default UserLegacyController;
