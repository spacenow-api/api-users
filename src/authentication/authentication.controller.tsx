import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import validationMiddleware from "../helpers/middlewares/validation-middleware";
import UserWithThatEmailAlreadyExistsException from '../helpers/exceptions/UserWithThatEmailAlreadyExistsException';
import WrongCredentialsException from '../helpers/exceptions/WrongCredentialsException';
import PasswordMatchException from '../helpers/exceptions/PasswordMatchException';
import CreateUserDTO from "../users/user.dto";
import CreateLoginDTO from "./authentication.dto";
import TokenController from '../token/token.controller';
import { User } from '../models';
 
class AuthenticationController {

  public path = '/auth';
  public router = Router();
  
  constructor() {
    this.intializeRoutes();
  }
 
  private intializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDTO), this.register);
    this.router.post(`${this.path}/signin`, validationMiddleware(CreateLoginDTO), this.signin);
  }
 
  private register = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserDTO = request.body;
    const user = await User.findOne({ where: {email: userData.email} });
    if(user)
      next(new UserWithThatEmailAlreadyExistsException(userData.email));
    else {
      await await User.create(user);
      const tokenData = new TokenController().createToken(user);
      response.send(tokenData);
    }
  }
 
  private signin = async (request: Request, response: Response, next: NextFunction) => {
    const logInData: CreateLoginDTO = request.body;
    const user = await User.findOne({ where: {email: logInData.email} });
    if(user) {
      const isPasswordMatching = await bcrypt.compare(logInData.password, user.password);
      if (isPasswordMatching) {
        const tokenData = new TokenController().createToken(user);
        response.send(tokenData);
      } else
        next(new PasswordMatchException());
    } else 
      next(new WrongCredentialsException());
  }

}
 
export default AuthenticationController;