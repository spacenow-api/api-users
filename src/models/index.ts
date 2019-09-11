import { User } from "./user.model";
import { Role } from "./role.model";
import { UserLegacy } from "./userLegacy.model";
import { AdminUserLegacy } from "./adminUserLegacy.model";
import { UserProfileLegacy } from "./userProfileLegacy.model";
import { UserVerifiedInfoLegacy } from "./userVerifiedInfoLegacy.model";
import { EmailTokenLegacy } from "./emailTokenLegacy.model";
import { ForgotPassword } from "./forgotPassword.model";
import { DocumentVerificationLegacy } from "./documentVerification.model";

export {
  User,
  Role,
  AdminUserLegacy,
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy,
  EmailTokenLegacy,
  ForgotPassword,
  DocumentVerificationLegacy
};

export const arrayOfModels = [
  AdminUserLegacy,
  UserLegacy,
  UserProfileLegacy,
  UserVerifiedInfoLegacy,
  EmailTokenLegacy,
  ForgotPassword,
  DocumentVerificationLegacy
];
