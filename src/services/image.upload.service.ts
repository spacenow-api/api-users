import { Request } from "express";
import * as AWS from "aws-sdk";
import multer from "multer";
import s3Storage from "multer-sharp-s3";
import * as config from "../config";
import crypto from "crypto";

const AWS_S3_BUCKET_NAME = config.bucket;
const s3 = new AWS.S3();

const imageFilter = (
  request: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void
): void => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    callback(null, true);
  } else {
    callback(
      new Error("Invalid file type, only JPEG and PNG is allowed!"),
      false
    );
  }
};

const options = {
  ACL: "public-read",
  s3,
  Bucket: `${AWS_S3_BUCKET_NAME}/avatar`
};

const Key = (
  request: Request,
  file: any,
  callback: (error: any, metadata?: any) => void
): void => {
  crypto.pseudoRandomBytes(16, (err, raw) => {
    let ext;
    switch (file.mimetype) {
      case "image/jpeg":
        ext = ".jpeg";
        break;
      default:
        ext = ".png";
        break;
    }
    try {
      callback(null, raw.toString("hex") + ext);
    } catch (err) {
      callback(err);
    }
  });
};

const upload = multer({
  fileFilter: imageFilter,
  storage: s3Storage({
    ...options,
    Key,
    toFormat: "jpeg"
  })
});

export default upload;
