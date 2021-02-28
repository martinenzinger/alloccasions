import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger';

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('bucketAccess');

export class BucketAccess {

  constructor(
    private readonly s3Client = createS3Client(),
    private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly expiration = process.env.SIGNED_URL_EXPIRATION) {
  }

  async getObjectSignedUrl(fileKey: string): Promise<string> {
    const result = this.s3Client.getSignedUrl('getObject', {
      Bucket: this.bucketName,
      Key: fileKey,
      Expires: this.expiration
    });
    logger.info("S3 - Get download URL: " + result);
    return result;
  }

  async putObjectSignedUrl(fileKey: string): Promise<string> {
    const result = this.s3Client.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: fileKey,
      Expires: this.expiration
    });
    logger.info("S3 - Get upload URL: " + result);
    return result;
  }

  async uploadBuffer(fileName: string, file: Buffer): Promise<string> {
      let result;
      try {
        result = await this.s3Client.upload({
          Key: fileName,
          Body: file,
          Bucket: this.bucketName,
          ContentType : 'application/pdf'
        }).promise();
      } catch(err) {
        return err;
      }
      logger.info("S3 - File successfully uploaded to " + result);
      return result;
  };

  async readFile(fileKey: string): Promise<Buffer> {
    let result;
    try {
      result = await this.s3Client.getObject({
        Bucket: this.bucketName,
        Key: fileKey
      }).promise();
    } catch(err) {
      return err;
    }
    logger.info("S3 - Get file " + fileKey);
    return result.Body;
  };

  async deleteFile(fileName: string, userId: string): Promise<Buffer> {
    let result;
    try {
      result = await this.s3Client.deleteObject({
        Bucket: this.bucketName,
        Key: fileName
      }).promise();
    } catch(err) {
      return err;
    } 
    logger.info("S3 - Delete file " + userId + "," + fileName);
    return result;
  };

  async fileExists(fileName: string): Promise<boolean> {
    let result;
    try {
      result = await this.s3Client.headObject({
        Bucket: this.bucketName,
        Key: fileName
      }).promise();
    } catch(err) {
      return err;
    }
    logger.info("S3 - Check if file " + fileName + " exists.");
    return !!result;
  }

}

function createS3Client() {
  return new XAWS.S3({
    signatureVersion: 'v4'
  })
}
