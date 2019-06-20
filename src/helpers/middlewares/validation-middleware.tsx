import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import HttpException from '../exceptions/HttpException';
 
export default (type: any, skipMissingProperties = false): RequestHandler => {
  return (request: Request, response: Response, next: NextFunction) => {
    validate(plainToClass(type, request.body), { skipMissingProperties })
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
          next(new HttpException(400, message));
        } else {
          next();
        }
      });
  }
}