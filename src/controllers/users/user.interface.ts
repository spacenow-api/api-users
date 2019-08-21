interface AbstractUser {
	id: string;
	email: string;
	password: string;
}

interface IUser extends AbstractUser {
	isEmailConfirmed: boolean;
}

interface IUserLegacy extends AbstractUser { }

interface IUserLegacySignUpRequest {
	email: string;
	password?: string;
	firstName: string;
	lastName: string;
}

export { AbstractUser, IUser, IUserLegacy, IUserLegacySignUpRequest };