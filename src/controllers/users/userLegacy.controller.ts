import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import httpException from "../../helpers/exceptions/HttpException";
import errorMiddleware from "../../helpers/middlewares/error-middleware";
import upload from "../../services/image.upload.service";

import {
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy
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
  }

  private getUserLegacyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
      if (!user) next(new httpException(400, "User does not exist!"));
      else
        try {
          await UserLegacy.destroy({ where: { id: user.id } });
          next(new httpException(200, "User deleted successful!"));
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
      if (!user) next(new httpException(400, "User does not exist!"));
      else
        try {
          await UserLegacy.update(data, {
            where: { id: req.query.id }
          });
          next(new httpException(200, "User updated successful!"));
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
      if (!user) next(new httpException(400, "User does not exist!"));
      else
        try {
          await UserProfileLegacy.update(data, {
            where: { userId: req.query.id }
          });
          next(new httpException(200, "User profile updated successful!"));
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
      if (!user) next(new httpException(400, "User does not exist!"));
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
                new httpException(
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
}

export default UserLegacyController;
