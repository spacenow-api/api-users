import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import httpException from "../../helpers/exceptions/HttpException";
import errorMiddleware from "../../helpers/middlewares/error-middleware";

import { IUser } from "./user.interface";

import { User } from "../../models";

class UsersController {
  private path = "/users";

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(this.path, authMiddleware, this.getAllUsers);
    this.router.get(`${this.path}/:id`, this.getUser);
    this.router.post(this.path, this.createUser);
    this.router.patch(this.path, this.createUser);
    this.router.delete(
      `${this.path}/deleteByEmail/:email`,
      this.deleteUserByEmail
    );
  }

  private getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const users = await User.findAll();
      res.send(users);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findOne({ where: { id: req.params.id } });
      res.send(user);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };

  private createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const data: IUser = req.body;
    try {
      const user = await User.create(data);
      res.send(user);
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
      const user = await User.findOne({ where: { email: req.params.email } });
      if (!user) new httpException(400, "User does not exist!");
      try {
        await User.destroy({ where: { email: req.params.email } });
        new httpException(200, "User deleted successful!");
      } catch (error) {
        errorMiddleware(error, req, res, next);
      }
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };
}

export default UsersController;
