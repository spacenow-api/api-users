import { Router, Request, Response, NextFunction } from 'express';
import sequelizeErrorMiddleware from '../../helpers/middlewares/sequelize-error-middleware';
import IUser from './user.interface';
import { User } from '../../models';
import authMiddleware from '../../helpers/middlewares/auth-middleware';
 
class UsersController {

  public path = '/users';
  public router = Router();
  
  constructor() {
    this.intializeRoutes();
  }
 
  private intializeRoutes() {
    this.router.get(this.path, authMiddleware, this.getAllUsers);
    this.router.get(`${this.path}/:id`, this.getUser);
    this.router.post(this.path, this.createUser);
    this.router.patch(this.path, this.createUser);
  }
 
  private getAllUsers = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const users = await User.findAll();
      response.send(users);
    } catch (error) {
      sequelizeErrorMiddleware(error, request, response, next)
    }
  }

  private getUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const user = await User.findOne({ where: {id: request.params.id} });
      response.send(user);
    } catch (error) {
      sequelizeErrorMiddleware(error, request, response, next)
    }
  }
 
  private createUser = async (request: Request, response: Response, next: NextFunction) => {
    const data: IUser = request.body;
    try {
      const user = await User.create(data)
      response.send(user);
    } catch (error) {
      sequelizeErrorMiddleware(error, request, response, next)
    }
  }

}
 
export default UsersController;