import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import httpException from "../../helpers/exceptions/HttpException";
import errorMiddleware from "../../helpers/middlewares/error-middleware";

import { UserLegancy } from "../../models";

class UserLegancyController {
  private path = "/users/legacy";

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get("/usersLegacy", authMiddleware, this.getAllUsersLegacy);
    this.router.get(`${this.path}/:id`, this.getUserLegancyById);
    this.router.delete(
      `${this.path}/deleteByEmail`,
      authMiddleware,
      this.deleteUserByEmail
    );
  }

  private getUserLegancyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await UserLegancy.findOne({ where: { id: req.params.id } });
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
      const users = await UserLegancy.findAll();
      res.send(users);
    } catch (error) {
      console.log(error);
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
      const user = await UserLegancy.findOne({ where: { email: email } });
      if (!user) next(new httpException(400, "User does not exist!"));
      else
        try {
          await UserLegancy.destroy({ where: { id: user.id } });
          next(new httpException(200, "User deleted successful!"));
        } catch (error) {
          errorMiddleware(error, req, res, next);
        }
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };
}

export default UserLegancyController;
