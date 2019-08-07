import { Router, Request, Response, NextFunction } from "express";
import Stripe from "stripe";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";
import authMiddleware from "../../helpers/middlewares/auth-middleware";
import HttpException from "../../helpers/exceptions/HttpException";

import { UserProfileLegancy } from "./../../models";

import { payment } from './../../config';

class PaymentController {

  private router = Router();

  private stripeInstance: Stripe = new Stripe(payment.stripe.secretKey);

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(`/payment/account`, authMiddleware, this.getAccount);
    this.router.post(`/payment/account`, authMiddleware, this.createAccount);
    this.router.delete(`/payment/account`, authMiddleware, this.removeAccount);
  }

  private getAccount = async (req: Request, res: Response, next: NextFunction) => {
    if (req.userIdDecoded) {
      try {
        const userProfileObj = await UserProfileLegancy.findOne({ where: { userId: req.userIdDecoded } });
        if (!userProfileObj) throw new HttpException(400, `User ${req.userIdDecoded} does not have a valid Profile.`);
        if (!userProfileObj.accountId) throw new HttpException(400, `User ${req.userIdDecoded} does not have Stripe Account ID.`);
        const account = await this.stripeInstance.accounts.retrieve(userProfileObj.accountId);
        if (!account) throw new HttpException(400, `Stripe Account ${userProfileObj.accountId} not found.`);
        res.send(account);
      } catch (err) {
        console.error(err);
        sequelizeErrorMiddleware(err, req, res, next);
      }
    }
  };

  private createAccount = async (req: Request, res: Response, next: NextFunction) => {
    if (req.userIdDecoded) {
      const ts = Math.round(new Date().getTime() / 1000);
      try {
        const userProfileObj = await UserProfileLegancy.findOne({ where: { userId: req.userIdDecoded } });
        if (!userProfileObj) throw new HttpException(400, `User ${req.userIdDecoded} does not have a valid Profile.`);
        if (userProfileObj.accountId) throw new HttpException(400, `User ${req.userIdDecoded} already has a valid Stripe Account ID.`);

        // Stripe Account Details...
        const data = req.body;
        data.tos_acceptance = {
          date: ts,
          ip: req.connection.remoteAddress,
        };

        const accountCreated = await this.stripeInstance.accounts.create(data);
        if (!accountCreated) throw new HttpException(400, `User ${req.userIdDecoded} does not have a valid Profile.`);
        await UserProfileLegancy.update({ accountId: accountCreated.id }, { where: { profileId: userProfileObj.profileId } });

        res.send(accountCreated);
      } catch (err) {
        console.error(err);
        sequelizeErrorMiddleware(err, req, res, next);
      }
    }
  };

  private removeAccount = async (req: Request, res: Response, next: NextFunction) => {
    if (req.userIdDecoded) {
      try {
        const userProfileObj = await UserProfileLegancy.findOne({ where: { userId: req.userIdDecoded } });
        if (!userProfileObj) throw new HttpException(400, `User ${req.userIdDecoded} does not have a valid Profile.`);
        if (userProfileObj.accountId) {
          await this.stripeInstance.accounts.del(userProfileObj.accountId);
          await UserProfileLegancy.update({ accountId: null }, { where: { profileId: userProfileObj.profileId } });
        }
        res.end();
      } catch (err) {
        console.error(err);
        sequelizeErrorMiddleware(err, req, res, next);
      }
    }
  };
}

export default PaymentController;
