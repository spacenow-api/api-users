interface AbstractUser {
	id: string;
	email: string;
	password: string;
}

interface IUser extends AbstractUser {
	isEmailConfirmed: boolean;
}

interface IUserLegacy extends AbstractUser { }

export { AbstractUser, IUser, IUserLegacy };