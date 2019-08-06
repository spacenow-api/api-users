import { User } from "./user.model";
import { Role } from "./role.model";
import { UserLegancy } from "./userLegancy.model";
import { AdminUserLegacy } from "./adminUserLegacy.model";
import { UserProfileLegancy } from "./userProfileLegancy.model";
import { UserVerifiedInfoLegancy } from "./userVerifiedInfoLegancy.model";

export {
  User,
  Role,
  AdminUserLegacy,
  UserLegancy,
  UserProfileLegancy,
  UserVerifiedInfoLegancy
};

export const arrayOfModels = [
  AdminUserLegacy,
  UserLegancy,
  UserProfileLegancy,
  UserVerifiedInfoLegancy
];
