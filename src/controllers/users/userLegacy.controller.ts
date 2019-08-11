import { Router, Request, Response, NextFunction } from 'express';

import sequelizeErrorMiddleware from '../../helpers/middlewares/sequelize-error-middleware';
import authMiddleware from '../../helpers/middlewares/auth-middleware';
import httpException from '../../helpers/exceptions/HttpException';
import errorMiddleware from '../../helpers/middlewares/error-middleware';

import { UserLegacy, UserProfileLegacy } from '../../models';

class UserLegacyController {
	private path = '/users/legacy';

	private router = Router();

	constructor() {
		this.intializeRoutes();
	}

	private intializeRoutes() {
		this.router.get(`${this.path}`, authMiddleware, this.getAllUsersLegacy);
		this.router.get(`${this.path}/:id`, this.getUserLegacyById);
		this.router.delete(
			`${this.path}/deleteByEmail`,
			authMiddleware,
			this.deleteUserByEmail,
		);
		this.router.patch(`${this.path}`, authMiddleware, this.setUserLegacy);
	}

	private getUserLegacyById = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const user = await UserLegacy.findOne({ where: { id: req.params.id } });
			res.send(user);
		} catch (error) {
			sequelizeErrorMiddleware(error, req, res, next);
		}
	};

	private getAllUsersLegacy = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const users = await UserLegacy.findAll({
				attributes: [
					'id',
					'email',
					'emailConfirmed',
					'role',
					'userBanStatus',
					'provider',
				],
				include: [
					{
						model: UserProfileLegacy,
						as: 'profile',
					},
				],
			});
			res.send(users);
		} catch (error) {
			sequelizeErrorMiddleware(error, req, res, next);
		}
	};

	private deleteUserByEmail = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const email = req.query.email;
			const user = await UserLegacy.findOne({ where: { email: email } });
			if (!user) next(new httpException(400, 'User does not exist!'));
			else
				try {
					await UserLegacy.destroy({ where: { id: user.id } });
					next(new httpException(200, 'User deleted successful!'));
				} catch (error) {
					errorMiddleware(error, req, res, next);
				}
		} catch (error) {
			sequelizeErrorMiddleware(error, req, res, next);
		}
	};

	private setUserLegacy = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const data = req.body;
		delete data.id;
		try {
			const user = await UserLegacy.findOne({ where: { id: req.query.id } });
			if (!user) next(new httpException(400, 'User does not exist!'));
			else
				try {
					await UserLegacy.update(data, {
						where: { id: req.query.id },
					});
					next(new httpException(200, 'User updated successful!'));
				} catch (error) {
					errorMiddleware(error, req, res, next);
				}
		} catch (error) {
			sequelizeErrorMiddleware(error, req, res, next);
		}
	};
}

export default UserLegacyController;
