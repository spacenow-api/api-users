interface AbstractUser {
	id: string;
	email: string;
	password: string;
}

interface IUser extends AbstractUser {
	isEmailConfirmed: boolean;
}

interface IUserLegancy extends AbstractUser { }

export { AbstractUser, IUser, IUserLegancy };