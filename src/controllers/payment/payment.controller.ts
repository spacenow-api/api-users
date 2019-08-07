import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import httpException from "../../helpers/exceptions/HttpException";

class PaymentController {

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(`/payment/account`, authMiddleware, this.getAccount);
    this.router.post(`/payment/account`, authMiddleware, this.createAccount);
    this.router.delete(`/payment/account`, authMiddleware, this.removeAccount);
  }

  private getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.end();
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.end();
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };

  private removeAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.end();
    } catch (err) {
      console.error(err);
      sequelizeErrorMiddleware(err, req, res, next);
    }
  };
}

export default PaymentController;
