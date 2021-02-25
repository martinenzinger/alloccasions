import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as mimemessage from 'mimemessage'
import { MailItem } from '../models/MailItem'
import { HeaderInfo } from '../models/HeaderInfo'
import { createLogger } from '../utils/logger'
import { STANDARD_EMAIL } from '../templates/standardEmail'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('mailsAccess');

export class MailsAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly sesClient: AWS.SES = createSESClient(),
    private readonly mailsTable = process.env.MAIL_ITEMS_TABLE) {
  }

  async getMailsForUser(userId: string): Promise<MailItem[]> {
    const result = await this.docClient.query({
        TableName: this.mailsTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()
    const items = result.Items
    return items as MailItem[]
  }

  async getMailItem(mailId: string, userId: string): Promise<MailItem> {
    const result = await this.docClient
        .get({
            TableName: this.mailsTable,
            Key: {
                mailId: mailId,
                userId: userId
            }
        })
        .promise()
    logger.info("DynamoDB - Get mail item: " + JSON.stringify(result.Item, null, 2));
    return result.Item as MailItem;
  }

  async createMailItem(mailItem: MailItem) {
    const result = await this.docClient.put({
            TableName: this.mailsTable,
            Item: {
                ...mailItem
            }
        }).promise()
    logger.info("DynamoDB - Create mail item: " + JSON.stringify(result, null, 2));
    return await this.getMailItem(mailItem.mailId, mailItem.userId);
  }

  async deleteMailItem(mailId: string, userId: string): Promise<MailItem> {
    const params = {
        TableName: this.mailsTable,
        Key:{
            mailId: mailId,
            userId: userId
        }
    };
    
    const mail = this.getMailItem(mailId, userId);
    const result = await this.docClient.delete(params).promise()
    logger.info("DynamoDB - Delete mail item: " + JSON.stringify(result, null, 2));
    return mail;
  }

  async sendSESMail(mailItem: MailItem, headerInfo: HeaderInfo, fileName: string, fileData: Buffer): Promise<string>{
    let result;
    try {
        var mailContent = mimemessage.factory({contentType: 'multipart/mixed',body: []});
        mailContent.header('From', headerInfo.senderName + ' <' + headerInfo.senderEmail + '>');
        mailContent.header('To', headerInfo.recipientEmail);
        mailContent.header('Subject', mailItem.subject);
    
        var alternateEntity = mimemessage.factory({
            contentType: 'multipart/alternate',
            body: []
        });
    
        var htmlEntity = mimemessage.factory({
            contentType: 'text/html;charset=UTF-8',
            body: STANDARD_EMAIL
          });
        alternateEntity.body.push(htmlEntity);
    
        mailContent.body.push(alternateEntity);
    
        var attachmentEntity = mimemessage.factory({
        contentType: 'application/pdf',
        contentTransferEncoding: 'base64',
        body: fileData.toString('base64').replace(/([^\0]{76})/g, "$1\n")
        });
        attachmentEntity.header('Content-Disposition', 'attachment ;filename="' + fileName + '"');
    
        mailContent.body.push(attachmentEntity);
    
        result = this.sesClient.sendRawEmail({
            RawMessage: { Data: mailContent.toString() }
        }).promise();
    } catch (err) {
        return err;
    }
    logger.info("DynamoDB - Send mail from " + headerInfo.senderEmail + " to " + headerInfo.recipientEmail);
    return result;
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info("Creating a local DynamoDB instance")
    // @ts-ignore
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  // @ts-ignore
  return new XAWS.DynamoDB.DocumentClient()
}

function createSESClient() {
  return new XAWS.SES();
}
