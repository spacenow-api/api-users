import {
  Table,
  Column,
  Model,
  IsUUID,
  PrimaryKey,
  Default,
} from "sequelize-typescript";

@Table({tableName: "user_notification"})
export class UserNotification extends Model<UserNotification> {

  @PrimaryKey
  @Column({field: "user_id"})
  userId!: string;

  @PrimaryKey
  @Column({field: "notification_id"})
  notificationId!: string;

  @Default(false)
  @Column({field: "is_sms"})
  isSMS!: boolean;

  @Default(false)
  @Column({field: "is_email"})
  isEmail!: boolean;

  @Default(false)
  @Column({field: "is_push_notification"})
  isPushNotification!: boolean;

  @Default(false)
  @Column({field: "created_at"})
  createdAt!: Date;

  @Default(false)
  @Column({field: "updated_at"})
  updatedAt!: Date;

}
