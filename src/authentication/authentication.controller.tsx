import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import validationMiddleware from "../helpers/middlewares/validation-middleware";
import UserWithThatEmailAlreadyExistsException from '../helpers/exceptions/UserWithThatEmailAlreadyExistsException';
import WrongCredentialsException from '../helpers/exceptions/WrongCredentialsException';
import CreateUserDTO from "../users/user.dto";
import CreateLoginDTO from "./authentication.dto";
import TokenController from '../token/token.controller';
import IUser from '../users/user.interface'
import usersMock from '../helpers/mocks/users.mock';
 
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
    const user = usersMock.find(user => user.email === userData.email);
    if(user)
      next(new UserWithThatEmailAlreadyExistsException(userData.email))
    else {
      const hashedPassword:string = await bcrypt.hash(userData.password, 10);
      const userList:IUser[] = usersMock.concat({
        ...userData,
        password: hashedPassword
      });
      const user = userList[userList.length - 1];
      const tokenData = new TokenController().createToken(user)
      response.send(tokenData);
    }
  }
 
  private signin = async (request: Request, response: Response, next: NextFunction) => {
    const logInData: CreateLoginDTO = request.body;
    const user = usersMock.find(user => user.email === logInData.email)
    if(user) {
      const isPasswordMatching = await bcrypt.compare(logInData.password, user.password);
      if (isPasswordMatching) {
        const tokenData = new TokenController().createToken(user);
        response.send(tokenData);
      } else
        next(new WrongCredentialsException());
    } else 
      next(new WrongCredentialsException());
  }

}
 
export default AuthenticationController;