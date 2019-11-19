import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";

import { IUser } from "./user.interface";

import { User, UserNotification } from "../../models";

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
    this.router.get(`${this.path}/:id/notifications`, this.getUserNotifications);
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

  private getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await UserNotification.findAll({ where: { userId: req.params.id } });
      res.send(data);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };
}

export default UsersController;

// curl https://api.stripe.com/v1/accounts/acct_1FeWDcBkGEZB9jTW -u sk_live_zrme5qrCeqEjAAV6uPCmFWqW: -d "tos_acceptance[date]"=1574037760 -d "tos_acceptance[ip]"="202.172.130.201"


// 1574037273361