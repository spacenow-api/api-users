import { Table, Column, Model, CreatedAt, UpdatedAt, IsEmail, IsUUID, PrimaryKey, Length, Unique, Default, BeforeCreate } from 'sequelize-typescript';
import bcrypt from 'bcrypt';
import uuidV4 from 'uuid/v4'

@Table
export class User extends Model<User> {
 
  @IsUUID(4)
  @PrimaryKey
  @Column
  id!: string;
 
  @Unique
  @IsEmail
  @Column
  email!: string;

  @Length({min: 8, max: 12})
  @Column
  password!: string;

  @Default(false)
  @Column
  isEmailConfirmed?: boolean;

  @CreatedAt
  @Column
  createdAt!: Date;

  @UpdatedAt
  @Column
  updatedAt!: Date;

  @BeforeCreate
  static async generateId(instance: User) {
    instance.id = uuidV4();
  }

  @BeforeCreate
  static async hashPassword(instance: User) {
    instance.password = bcrypt.hashSync(instance.password, bcrypt.genSaltSync(8));
  }
 
}