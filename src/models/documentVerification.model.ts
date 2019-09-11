import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  BeforeCreate,
  AllowNull,
  BelongsTo,
  ForeignKey,
  Default,
  DataType
} from "sequelize-typescript";

import uuidV4 from "uuid/v4";
import { UserLegacy } from ".";

@Table({
  tableName: "DocumentVerification"
})
export class DocumentVerificationLegacy extends Model<
  DocumentVerificationLegacy
> {
  @IsUUID(4)
  @PrimaryKey
  @Column
  id!: string;

  @ForeignKey(() => UserLegacy)
  @AllowNull(false)
  @Column
  userId!: string;

  @AllowNull(false)
  @Column
  fileName!: string;

  @AllowNull(false)
  @Column
  fileType!: string;

  @Default("pending")
  @Column(DataType.ENUM("pending", "approved"))
  documentStatus!: string;

  @BelongsTo(() => UserLegacy)
  user: UserLegacy | undefined;

  @BeforeCreate
  static generateId(instance: UserLegacy): void {
    instance.id = uuidV4();
  }
}
