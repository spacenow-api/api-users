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
} from "sequelize-typescript";

import bcryptjs from "bcryptjs";

import uuidV4 from "uuid/v4";

@Table({
  tableName: 'User'
})
export class UserLegancy extends Model<UserLegancy> {

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

  @BeforeCreate
  static async generateId(instance: UserLegancy) {
    instance.id = uuidV4();
  }

  @BeforeCreate
  static async hashPassword(instance: UserLegancy) {
    instance.password = bcryptjs.hashSync(
      instance.password,
      bcryptjs.genSaltSync(8)
    );
  }
}
