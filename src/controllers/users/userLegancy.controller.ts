import { Router, Request, Response, NextFunction } from "express";

import sequelizeErrorMiddleware from "../../helpers/middlewares/sequelize-error-middleware";

import { UserLegancy } from "../../models";

class UserLegancyController {

  private router = Router();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(`/users/legancy/:id`, this.getUserLegancyById);
  }

  private getUserLegancyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserLegancy.findOne({ where: { id: req.params.id } });
      res.send(user);
    } catch (error) {
      sequelizeErrorMiddleware(error, req, res, next);
    }
  };
}

export default UserLegancyController;
