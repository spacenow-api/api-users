import { Router, Request, Response, NextFunction } from "express";
import { differenceInHours, subDays, format } from "date-fns";
import axios from 'axios';
import Sequelize from "sequelize";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import HttpException from "../../helpers/exceptions/HttpException";
import errorMiddleware from "../../helpers/middlewares/error-middleware";
import CryptoUtils from "./../../helpers/utils/crypto.utils";

import upload from "../../services/image.upload.service";
import uploadDoc from "../../services/document.upload.service";
import EmailService from "./../../services/email.service";
import { AuthenticationService } from './../../services/authentication.service';

import {
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy,
  ForgotPassword,
  DocumentVerificationLegacy,
  EmailTokenLegacy
} from "../../models";

import * as config from './../../config';

const Op = Sequelize.Op;

class UserLegacyController {

  private path = "/users/legacy";

  private router = Router();

  private emailService = new EmailService();

  private cryptoUtils = new CryptoUtils();

  private authService = new AuthenticationService();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.getAllUsersLegacy);
    this.router.get(`${this.path}/count/users`, authMiddleware, this.getTotalUsersLegacy);
    this.router.get(`${this.path}/count/users/date`, authMiddleware, this.getTotalUsersLegacyByDate);
    this.router.get(`${this.path}/:id`, this.getUserLegacyById);
    this.router.get(
      `${this.path}/documents/:id`,
      authMiddleware,
      this.getUserDocuments
    );
    this.router.delete(`${this.path}`, authMiddleware, this.deleteUserByEmail);
    this.router.patch(`${this.path}`, authMiddleware, this.setUserLegacy);
    this.router.patch(
      `${this.path}/profile`,
      authMiddleware,
      this.updateUserProfileLegacy
    );
    this.router.post(
      `${this.path}/profile/picture`,
      authMiddleware,
      this.updateProfilePicture
    );
    this.router.post(
      `${this.path}/document/:id`,
      authMiddleware,
      this.uploadDocument
    );
    this.router.delete(
      `${this.path}/document/:id`,
      authMiddleware,
      this.deleteDocument
    );
    this.router.post(`${this.path}/password/reset`, this.resetPassword);
    this.router.post(`${this.path}/password/reset/update`, this.resetPasswordUpdate);
    this.router.post(`${this.path}/reset/verification`, authMiddleware, this.resetEmailVerification);
    this.router.post(`${this.path}/email/verification`, authMiddleware, this.confirmEmailVerification);
  }

  async fetchUser(id: string) {
    return await UserLegacy.findOne({
      where: { id },
      include: [{
        model: UserProfileLegacy,
        as: "profile"
      }]
    });
  }

  private getUserLegacyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.fetchUser(req.params.id);
      res.send(user);
    } catch (error) {
      console.error(error);
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private getAllUsersLegacy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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

  private deleteUserByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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

  private setUserLegacy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
            response.send(error);
          } else {
            const file: any = request.file;
            try {
              const toSave = Object.assign({}, { picture: file.Location });
              await UserProfileLegacy.update(toSave, {
                where: { userId: request.query.id }
              });
              response.send({ ...toSave, userId: request.query.id });
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

  private uploadDocument = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { id } = request.params;
    try {
      const user = await UserLegacy.findOne({
        where: { id }
      });
      if (!user) next(new HttpException(400, "User does not exist!"));
      else
        await uploadDoc.single("file")(request, response, async error => {
          if (error) {
            response.send(error);
          } else {
            const file: any = request.file;
            try {
              const toSave = Object.assign(
                {},
                { userId: id, fileName: file.Location, fileType: file.mimetype }
              );
              const data = await DocumentVerificationLegacy.create(toSave);
              response.send(data);
            } catch (error) {
              response.send(error);
            }
          }
        });
    } catch (error) {
      console.error(error);
      response.send(error);
    }
  };

  private deleteDocument = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { id } = request.params;
    const { userId } = request.query;

    try {
      const user = await UserLegacy.findOne({
        where: { id: userId }
      });
      if (!user) next(new HttpException(400, "User does not exist!"));
      else
        await DocumentVerificationLegacy.destroy({
          where: { userId, id }
        });
      response.send({ status: "OK", id });
    } catch (error) {
      console.error(error);
      response.send(error);
    }
  };

  private getUserDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await DocumentVerificationLegacy.findAndCountAll({
        where: { userId: req.params.id }
      });
      res.send(user);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.body || !req.body.email)
        throw new HttpException(400, "E-mail not found.");
      const userObj = await UserLegacy.findOne({
        where: { email: req.body.email }
      });
      if (!userObj)
        throw new HttpException(400, `User ${req.body.email} not exist!`);
      await ForgotPassword.destroy({
        where: { email: userObj.email, userId: userObj.id }
      });
      const token = this.cryptoUtils.encrypt(
        `${userObj.id}-time-${Date.now()}`
      );
      await ForgotPassword.create({
        userId: userObj.id,
        email: userObj.email,
        token
      });
      this.emailService.send("reset-email", req.body.email, {
        username: userObj.profile ? userObj.profile.firstName : "mate",
        resetLink: `${config.appUrl}/auth/reset_password?verify_token=${token}`
      }); // #EMAIL
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private resetPasswordUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.body || !req.body.token)
        throw new HttpException(400, "Token not provided.");
      if (!req.body.password)
        throw new HttpException(400, "New password not provided.");
      const userIdDecoded: string = await this.resetPasswordTokenValidate(
        req.body.token
      );
      const userObj = await UserLegacy.findOne({
        where: { id: userIdDecoded }
      });
      if (!userObj)
        throw new HttpException(400, `User ${userIdDecoded} not exist!`);
      await ForgotPassword.destroy({ where: { userId: userIdDecoded } });
      await UserLegacy.update(
        { password: UserLegacy.getPasswordHash(req.body.password) },
        { where: { id: userIdDecoded } }
      );
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private resetPasswordTokenValidate = async (token: string): Promise<string> => {
    const userId: string = this.cryptoUtils.decrypt(token).split("-time-")[0];
    const forgotRecord: ForgotPassword | null = await ForgotPassword.findOne({ where: { userId, token } });
    if (forgotRecord) {
      if (differenceInHours(forgotRecord.createdAt!, new Date()) > 1) {
        throw new HttpException(400, "Forgot password token has been expired.");
      }
      return userId;
    }
    throw new HttpException(400, `User does not have a forgot password register!`);
  };

  private resetEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.email) {
        throw new HttpException(400, "E-mail not found.");
      }
      const userObj = await UserLegacy.findOne({ where: { email: req.body.email }, include: [{ model: UserProfileLegacy, as: "profile" }] });
      if (!userObj) {
        throw new HttpException(400, `User ${req.body.email} not exist!`);
      }
      await UserLegacy.update({ emailConfirmed: 0 }, { where: { id: userObj.id } });
      await UserVerifiedInfoLegacy.update({ isEmailConfirmed: 0 }, { where: { userId: userObj.id } });
      await this.authService.sendEmailVerification(userObj.id, userObj.email, userObj.profile!.firstName || 'mate');
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private confirmEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.token) {
        throw new HttpException(400, "Token not provided.");
      }
      const userId = req.userIdDecoded || '';
      const userObj = await UserLegacy.findOne({ where: { id: userId } });
      if (!userObj) {
        throw new HttpException(400, `User not found or signined!`);
      }
      const whereTokenCondition = { where: { email: userObj.email, token: req.body.token } };
      const emailTokenRecord = await EmailTokenLegacy.count(whereTokenCondition);
      if (emailTokenRecord && emailTokenRecord > 0) {
        await UserLegacy.update({ emailConfirmed: 1 }, { where: { id: userId } });
        await UserVerifiedInfoLegacy.update({ isEmailConfirmed: 1 }, { where: { userId } });
        await EmailTokenLegacy.destroy(whereTokenCondition);
      }
      res.send(await this.fetchUser(userId))
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private getTotalUsersLegacy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const users = await UserLegacy.count();
      const { data } = await axios.get(`${config.apiSpaces}/listings/count/hosts`, { headers: req.headers })
      res.send({
        count: users,
        hosts: data.count,
        guests: (users - data.count)
      });
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private getTotalUsersLegacyByDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const days = req.query.days || 10000
    const date = format(subDays(new Date(), days), "yyyy-MM-dd");
    try {
      const data = await UserLegacy.count({
        where: { 
          createdAt: { 
            [Op.gte]: `${date}`
          }
        }
      });
      res.send({ count: data });
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

}

export default UserLegacyController;
