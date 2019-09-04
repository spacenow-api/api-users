import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import HttpException from "../../helpers/exceptions/HttpException";
import errorMiddleware from "../../helpers/middlewares/error-middleware";

import {
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy,
  ForgotPassword
} from "../../models";

class UserLegacyController {

  private path = "/users/legacy";

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.getAllUsersLegacy);
    this.router.get(`${this.path}/:id`, this.getUserLegacyById);
    this.router.delete(`${this.path}`, authMiddleware, this.deleteUserByEmail);
    this.router.patch(`${this.path}`, authMiddleware, this.setUserLegacy);
    this.router.post(`${this.path}/password/reset`, this.resetPassword);
    this.router.post(`${this.path}/password/reset/validation`, this.resetPasswordValidation);
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

  private resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.email) throw new HttpException(400, 'E-mail not found.');
      const userObj = await UserLegacy.findOne({ where: { email: req.body.email } });
      if (!userObj) throw new HttpException(400, `User ${req.body.email} not exist!`);
      await ForgotPassword.destroy({ where: { email: userObj.email, userId: userObj.id } });
      await ForgotPassword.create({ userId: userObj.id, email: userObj.email, token: Date.now() });
      // #EMAIL
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  private resetPasswordValidation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.email) throw new HttpException(400, 'E-mail not found.');
      if (!req.body.token) throw new HttpException(400, "Token not provided.");
      const userObj = await UserLegacy.findOne({ where: { email: req.body.email } });
      if (!userObj) throw new HttpException(400, `User ${req.body.email} not exist!`);
      await this.resetPasswordTokenValidate(req.body.email, req.body.token);
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  private resetPasswordUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !req.body.email) throw new HttpException(400, 'E-mail not found.');
      if (!req.body.token) throw new HttpException(400, "Token not provided.");
      if (!req.body.password) throw new HttpException(400, "New password not provided.");
      await this.resetPasswordTokenValidate(req.body.email, req.body.token);
      const userObj = await UserLegacy.findOne({ where: { email: req.body.email } });
      if (!userObj) throw new HttpException(400, `User ${req.body.email} not exist!`);
      await ForgotPassword.destroy({ where: { email: userObj.email, userId: userObj.id } });
      await UserLegacy.update({ password: UserLegacy.getPasswordHash(req.body.password) }, { where: { id: userObj.id } });
      res.send({ status: "OK" });
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  }

  private resetPasswordTokenValidate = async (email: string, token: string): Promise<void> => {
    const forgotCount = await ForgotPassword.count({ where: { email, token } });
    if (forgotCount <= 0) throw new HttpException(400, `User ${email} does not have a forgot password register!`);
  }
}

export default UserLegacyController;
