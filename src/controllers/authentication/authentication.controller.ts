import { Router, Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import UserWithThatEmailAlreadyExistsException from "../../helpers/exceptions/UserWithThatEmailAlreadyExistsException";
import WrongCredentialsException from "../../helpers/exceptions/WrongCredentialsException";
import PasswordMatchException from "../../helpers/exceptions/PasswordMatchException";

import { DataStoredInToken } from "../../commons/token.interface";
import { Token } from "../../commons";

import { AbstractUser } from "../users/user.interface";

import {
  UserLegacy,
  AdminUserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy
} from "../../models";

class AuthenticationController {
  private path = "/auth";

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    // For now, only using signIn endpoint and work with register on Legacy application. [Arthemus]
    // this.router.post(`${this.path}/register`, this.register);
    this.router.post(`${this.path}/signin`, this.signin);
    this.router.post(`${this.path}/adminSignin`, this.adminSignin);
    this.router.post(`${this.path}/token/validate`, this.tokenValidate);
    this.router.post(
      `${this.path}/token/adminValidate`,
      this.tokenAdminValidate
    );
  }

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userData: AbstractUser = req.body;
    const user = await UserLegacy.findOne({
      where: { email: userData.email }
    });
    if (user) {
      next(new UserWithThatEmailAlreadyExistsException(userData.email));
    } else {
      await UserLegacy.create(userData);
      const tokenData = Token.create(userData);
      res.send(tokenData);
    }
  };

  private signin = async (req: Request, res: Response, next: NextFunction) => {
    const logInData: AbstractUser = req.body;
    const userObj = await UserLegacy.findOne({
      where: { email: logInData.email }
    });
    if (userObj) {
      const isPasswordMatching = await bcryptjs.compare(
        logInData.password,
        userObj.password
      );
      if (isPasswordMatching) {
        const tokenData = Token.create(userObj);
        res.send(tokenData);
      } else next(new PasswordMatchException());
    } else next(new WrongCredentialsException());
  };

  private adminSignin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const logInData: AbstractUser = req.body;
    const adminObj = await UserLegacy.findOne({
      where: { email: logInData.email, role: "admin" }
    });
    if (adminObj) {
      const isPasswordMatching = await bcryptjs.compare(
        logInData.password,
        adminObj.password
      );
      if (isPasswordMatching) {
        const tokenData = Token.create(adminObj);
        res.send(tokenData);
      } else next(new PasswordMatchException());
    } else next(new WrongCredentialsException());
  };

  private tokenValidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const data = req.body;
    const secret: string = process.env.JWT_SECRET || "Spacenow";
    try {
      const decoded = await jwt.verify(data.token, secret);
      if (decoded) {
        const tokenDecoded = <DataStoredInToken>decoded;
        const userId: string = tokenDecoded.id;
        const userObj = <UserLegacy>(
          await UserLegacy.findOne({ where: { id: userId }, raw: true })
        );
        const userProfileObj = <UserProfileLegacy>(
          await UserProfileLegacy.findOne({ where: { userId }, raw: true })
        );
        const userVerifiedObj = <UserVerifiedInfoLegacy>(
          await UserVerifiedInfoLegacy.findOne({
            where: { userId },
            raw: true
          })
        );
        res.status(200).send({
          status: "OK",
          user: {
            ...userObj,
            profile: {
              ...userProfileObj
            },
            verification: {
              ...userVerifiedObj
            }
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(200).send({ status: "Expired" });
    }
  };

  private tokenAdminValidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const data = req.body;
    const secret: string = process.env.JWT_SECRET || "Spacenow";
    try {
      const decoded = await jwt.verify(data.token, secret);
      if (decoded) {
        const tokenDecoded = <DataStoredInToken>decoded;
        const adminId: string = tokenDecoded.id;
        const adminObj = <UserLegacy>await UserLegacy.findOne({
          where: { id: adminId, role: "admin" },
          raw: true
        });
        res.status(200).send({
          status: "OK",
          admin: {
            ...adminObj
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(200).send({ status: "Expired" });
    }
  };
}

export default AuthenticationController;
