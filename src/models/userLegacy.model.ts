import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  IsEmail,
  IsUUID,
  PrimaryKey,
  Default,
  BeforeCreate,
  AllowNull,
  HasOne
} from "sequelize-typescript";

import bcryptjs from "bcryptjs";

import uuidV4 from "uuid/v4";
import { UserProfileLegacy } from "./";

@Table({
  tableName: "User"
})
export class UserLegacy extends Model<UserLegacy> {
  @IsUUID(4)
  @PrimaryKey
  @AllowNull(false)
  @Column
  id!: string;

  @IsEmail
  @AllowNull(false)
  @Column
  email!: string;

  @AllowNull(false)
  @Column
  password!: string;

  @Default(0)
  @Column
  emailConfirmed?: number;

  @Column
  type?: string;

  @CreatedAt
  @Column
  createdAt?: Date;

  @UpdatedAt
  @Column
  updatedAt?: Date;

  @Default(0)
  @Column
  userBanStatus?: number;

  @Default("user")
  @Column
  role?: string;

  @HasOne(() => UserProfileLegacy)
  profile: UserProfileLegacy | undefined;

  @BeforeCreate
  static async generateId(instance: UserLegacy) {
    instance.id = uuidV4();
  }

  @BeforeCreate
  static async hashPassword(instance: UserLegacy) {
    instance.password = bcryptjs.hashSync(
      instance.password,
      bcryptjs.genSaltSync(8)
    );
  }
}
