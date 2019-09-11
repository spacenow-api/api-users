import { Request } from "express";
import * as AWS from "aws-sdk";
import multer from "multer";
import s3Storage from "multer-sharp-s3";
import * as config from "../config";
import crypto from "crypto";

const AWS_S3_BUCKET_NAME = config.bucket;
const s3 = new AWS.S3();

const options = {
  ACL: "public-read",
  s3,
  Bucket: `${AWS_S3_BUCKET_NAME}/documents`
};

export default multer({
  storage: s3Storage({
    ...options
  })
});
