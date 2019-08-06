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
  AllowNull
} from "sequelize-typescript";

import bcryptjs from "bcryptjs";

import uuidV4 from "uuid/v4";

@Table({
  tableName: "AdminUser"
})
export class AdminUserLegacy extends Model<AdminUserLegacy> {
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
  emailConfirmed?: boolean;

  @Default(0)
  @Column
  isSuperAdmin?: boolean;

  @Default("admin")
  @Column
  role?: string;

  @CreatedAt
  @Column
  createdAt?: Date;

  @UpdatedAt
  @Column
  updatedAt?: Date;

  @BeforeCreate
  static async generateId(instance: AdminUserLegacy) {
    instance.id = uuidV4();
  }

  @BeforeCreate
  static async hashPassword(instance: AdminUserLegacy) {
    instance.password = bcryptjs.hashSync(
      instance.password,
      bcryptjs.genSaltSync(8)
    );
  }
}
