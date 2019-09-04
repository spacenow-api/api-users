import {
  Table,
  Column,
  Model,
  IsEmail,
  PrimaryKey,
  AllowNull,
  AutoIncrement,
  ForeignKey,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import { UserLegacy } from ".";

@Table({
  tableName: "ForgotPassword"
})
export class ForgotPassword extends Model<ForgotPassword> {

  @AutoIncrement
  @PrimaryKey
  @AllowNull(false)
  @Column
  id!: number;

  @ForeignKey(() => UserLegacy)
  @AllowNull(false)
  @Column
  userId!: string;

  @IsEmail
  @AllowNull(false)
  @Column
  email!: string;

  @AllowNull(false)
  @Column
  token!: string;

  @CreatedAt
  @Column
  createdAt?: Date;

  @UpdatedAt
  @Column
  updatedAt?: Date;
}
