import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  AllowNull,
  AutoIncrement,
  Unique
} from "sequelize-typescript";

@Table({
  tableName: 'UserVerifiedInfo'
})
export class UserVerifiedInfoLegacy extends Model<UserVerifiedInfoLegacy> {

  @PrimaryKey
  @AllowNull(false)
  @Column
  id!: number;

  @AllowNull(false)
  @Column
  userId!: string;

  @Default(0)
  @Column
  isEmailConfirmed?: number;

  @Default(0)
  @Column
  isFacebookConnected?: number;

  @Default(0)
  @Column
  isGoogleConnected?: number;

  @Default(0)
  @Column
  isIdVerification?: number;

  @Default(0)
  @Column
  isPhoneVerified?: number;
}
