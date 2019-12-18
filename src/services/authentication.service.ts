import { Response, NextFunction } from 'express'

import { IUserLegacySignUpRequest } from './../controllers/users/user.interface'

import UserWithThatEmailAlreadyExistsException from './../helpers/exceptions/UserWithThatEmailAlreadyExistsException'
import HttpException from './../helpers/exceptions/HttpException'
import CryptoUtils from './../helpers/utils/crypto.utils'

import EmailService from './email.service'

import { UserLegacy, AdminUserLegacy, UserProfileLegacy, UserVerifiedInfoLegacy, EmailTokenLegacy } from './../models'

import * as config from './../config'
import { format } from 'date-fns'

class AuthenticationService {
  private emailService = new EmailService()

  private cryptoUtils = new CryptoUtils()

  public async registerNewUser(userData: IUserLegacySignUpRequest, singUpType: string = 'email'): Promise<UserLegacy> {
    const { email } = userData
    if ((await UserLegacy.count({ where: { email } })) > 0) {
      throw new UserWithThatEmailAlreadyExistsException(email)
    } else if ((await AdminUserLegacy.count({ where: { email } })) > 0) {
      throw new UserWithThatEmailAlreadyExistsException(email)
    } else {
      const updatedFirstName = this.capitalizeFirstLetter(userData.firstName)
      const updatedLastName = this.capitalizeFirstLetter(userData.lastName)
      const userCreated: UserLegacy = await UserLegacy.create({
        email,
        password: userData.password,
        emailConfirmed: false,
        type: singUpType,
        userType: userData.userType
      })
      await UserProfileLegacy.create({
        userId: userCreated.id,
        firstName: updatedFirstName,
        lastName: updatedLastName,
        displayName: `${updatedFirstName} ${updatedLastName}`
      })
      await UserVerifiedInfoLegacy.create({ userId: userCreated.id })
      await this.sendEmailVerification(userCreated.id, userCreated.email, updatedFirstName)
      this.emailService.send('welcome', email, {
        guest: updatedFirstName,
        currentDate: format(new Date(), 'EEEE d MMMM, yyyy')
      })
      return userCreated
    }
  }

  private capitalizeFirstLetter(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  public async getUserData(userId: string): Promise<any> {
    const userObj = await UserLegacy.findOne({ where: { id: userId }, raw: true })
    if (!userObj) throw new HttpException(400, `User ${userId} not exist!`)
    const userProfileObj = await UserProfileLegacy.findOne({ where: { userId }, raw: true })
    const userVerifiedObj = await UserVerifiedInfoLegacy.findOne({ where: { userId }, raw: true })
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
    const userData = await this.getUserData(userId)
    res.status(200).send({ status: 'OK', user: userData })
  }

  public async sendEmailVerification(userId: string, userEmail: string, userName: string): Promise<void> {
    const token = this.cryptoUtils.encrypt(`${userId}`)
    await EmailTokenLegacy.create({ email: userEmail, userId: userId, token })
    this.emailService.send('confirm-email', userEmail, {
      user: userName,
      link: `${config.appUrl}/account/profile?confirmation=${token}`,
      currentDate: format(new Date(), 'EEEE d MMMM, yyyy')
    })
  }

  public validateUserBanned(userObject: UserLegacy, next: NextFunction): void {
    if (userObject.userBanStatus == 1) {
      next(new HttpException(400, `User ${userObject.email} was blocked by Spacenow`))
    }
  }
}

export { AuthenticationService }
