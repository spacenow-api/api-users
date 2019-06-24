import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import UserWithThatEmailAlreadyExistsException from '../helpers/exceptions/UserWithThatEmailAlreadyExistsException';
import WrongCredentialsException from '../helpers/exceptions/WrongCredentialsException';
import PasswordMatchException from '../helpers/exceptions/PasswordMatchException';
import TokenController from '../token/token.controller';
import { User } from '../models';
import IUser from 'users/user.interface';
 
class AuthenticationController {

  public path = '/auth';
  public router = Router();
  
  constructor() {
    this.intializeRoutes();
  }
 
  private intializeRoutes() {
    this.router.post(`${this.path}/register`, this.register);
    this.router.post(`${this.path}/signin`, this.signin);
  }
 
  private register = async (request: Request, response: Response, next: NextFunction) => {
    const userData: IUser = request.body;
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
    const logInData: IUser = request.body;
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