import { NextFunction, Response, Request } from "express";

export default (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  console.debug("Running Database middleware.");
  //sequelize.sync();
  next();
};
