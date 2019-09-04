import {
  Table,
  Column,
  Model,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  AutoIncrement
} from "sequelize-typescript";

@Table({
  tableName: 'EmailToken'
})
export class EmailTokenLegacy extends Model<EmailTokenLegacy> {

  @AutoIncrement
  @PrimaryKey
  @AllowNull(false)
  @Column
  id!: number;

  @AllowNull(false)
  @Column
  userId!: string;

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
