import { Table, Column, Model, CreatedAt, UpdatedAt, IsEmail, IsUUID, PrimaryKey, Length, Unique, Default, BeforeCreate } from 'sequelize-typescript';
import bcrypt from 'bcrypt';

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
  emailConfirmed?: boolean;

  @CreatedAt
  @Column
  createdAt!: Date;

  @UpdatedAt
  @Column
  updatedAt!: Date;

  @BeforeCreate
  static async hashPassword(instance: User) {
    instance.password = bcrypt.hashSync(instance.password, bcrypt.genSaltSync(8));
  }
 
}