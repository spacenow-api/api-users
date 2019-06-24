import { Router, Request, Response, NextFunction } from 'express';
import sequelizeErrorMiddleware from '../helpers/middlewares/sequelize-error-middleware';
import IRole from './role.interface';
import { Role } from '../models';
 
class RolesController {

  public path = '/roles';
  public router = Router();
  
  constructor() {
    this.intializeRoutes();
  }
 
  private intializeRoutes() {
    this.router.get(this.path, this.getAllRoles);
    this.router.get(`${this.path}/:id`, this.getRole);
    this.router.post(this.path, this.createRole);
    this.router.patch(this.path, this.createRole);
  }
 
  private getAllRoles = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const roles = await Role.findAll();
      response.send(roles);
    } catch (error) {
      sequelizeErrorMiddleware(error, request, response, next)
    }
  }

  private getRole = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const role = await Role.findOne({ where: {id: request.params.id} });
      response.send(role);
    } catch (error) {
      sequelizeErrorMiddleware(error, request, response, next)
    }
  }
 
  private createRole = async (request: Request, response: Response, next: NextFunction) => {
    const data: IRole = request.body;
    try {
      const role = await Role.create(data)
      response.send(role);
    } catch (error) {
      sequelizeErrorMiddleware(error, request, response, next)
    }
  }

}
 
export default RolesController;