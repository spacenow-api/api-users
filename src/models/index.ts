import { User } from './user.model';
import { Role } from './role.model';
import { UserLegancy } from './userLegancy.model';
import { UserProfileLegancy } from './userProfileLegancy.model';
import { UserVerifiedInfoLegancy } from './userVerifiedInfoLegancy.model'

export { User, Role, UserLegancy, UserProfileLegancy, UserVerifiedInfoLegancy };

export const arrayOfModels = [UserLegancy, UserProfileLegancy, UserVerifiedInfoLegancy];
