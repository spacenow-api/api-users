interface AbstractUser {
  id: string;
  email: string;
  password: string;
}

interface IUser extends AbstractUser {
  isEmailConfirmed: boolean;
}

interface IUserLegacy extends AbstractUser {}

interface IUserLegacySignUpRequest {
  email: string;
  password?: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  userType: string;
}

interface IUserLegacySignUpLandingPageRequest {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export { AbstractUser, IUser, IUserLegacy, IUserLegacySignUpRequest, IUserLegacySignUpLandingPageRequest };
