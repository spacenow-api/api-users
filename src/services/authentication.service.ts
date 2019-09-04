import { Response } from 'express';

import { IUserLegacySignUpRequest } from "./../controllers/users/user.interface";

import UserWithThatEmailAlreadyExistsException from "./../helpers/exceptions/UserWithThatEmailAlreadyExistsException";
import HttpException from "./../helpers/exceptions/HttpException";

import { UserLegacy, AdminUserLegacy, UserProfileLegacy, UserVerifiedInfoLegacy, EmailTokenLegacy } from "./../models";

class AuthenticationService {

  public async registerNewUser(userData: IUserLegacySignUpRequest): Promise<UserLegacy> {
    const { email } = userData;
    if (await UserLegacy.count({ where: { email } }) > 0) {
      throw new UserWithThatEmailAlreadyExistsException(email);
    } else if (await AdminUserLegacy.count({ where: { email } }) > 0) {
      throw new UserWithThatEmailAlreadyExistsException(email);
    } else {
      const updatedFirstName = this.capitalizeFirstLetter(userData.firstName);
      const updatedLastName = this.capitalizeFirstLetter(userData.lastName);
      const userCreated: UserLegacy = await UserLegacy.create({
        email,
        password: userData.password,
        emailConfirmed: true,
        type: 'email'
      });
      await UserProfileLegacy.create({
        userId: userCreated.id,
        firstName: updatedFirstName,
        lastName: updatedLastName,
        displayName: `${updatedFirstName} ${updatedLastName}`
      });
      await UserVerifiedInfoLegacy.create({ userId: userCreated.id });
      await EmailTokenLegacy.create({ email, userId: userCreated.id, token: Date.now() });
      // #EMAIL
      return userCreated;
    }
  }

  private capitalizeFirstLetter(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  public async getUserData(userId: string): Promise<any> {
    const userObj = await UserLegacy.findOne({ where: { id: userId }, raw: true });
    if (!userObj) throw new HttpException(400, `User ${userId} not exist!`);
    const userProfileObj = await UserProfileLegacy.findOne({ where: { userId }, raw: true });
    const userVerifiedObj = await UserVerifiedInfoLegacy.findOne({ where: { userId }, raw: true });
    return {
      ...userObj,
      profile: {
        ...userProfileObj
      },
      verification: {
        ...userVerifiedObj
      }
    }
  }

  public async sendUserData(res: Response, userId: string): Promise<void> {
    const userData = await this.getUserData(userId);
    res.status(200).send({ status: "OK", user: userData });
  }
}

export { AuthenticationService };