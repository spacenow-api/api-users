import { Router, Request, Response } from 'express';
import validationMiddleware from '../helpers/middlewares/validation-middleware';
import userDTO from './user.dto';
import IUser from './user.interface';
import { User } from '../models';

import usersMock from '../helpers/mocks/users.mock';
 
class UsersController {

  public path = '/users';
  public router = Router();
  
  constructor() {
    this.intializeRoutes();
  }
 
  private intializeRoutes() {
    this.router.get(this.path, this.getAllUsers);
    this.router.get(`${this.path}/:id`, this.getUser);
    this.router.post(this.path, validationMiddleware(userDTO), this.createUser);
    this.router.patch(this.path, validationMiddleware(userDTO, true), this.createUser);
  }
 
  private getAllUsers = async (request: Request, response: Response) => {
    const users = await User.findAll();
    console.log(users);
    response.send(users);
  }

  private getUser = async (request: Request, response: Response) => {
    const user = await User.findOne({ where: {id: request.params.id} });
    response.send(user);
  }

  private getUser = (request: Request, response: Response) => {
    const user = usersMock.find(user => user.id === request.params.id);
    response.send(user);
  }
 
  private createUser = (request: Request, response: Response) => {
    const user: IUser = request.body;
    usersMock.concat(user);
    response.send(user);
  }

}
 
export default UsersController;