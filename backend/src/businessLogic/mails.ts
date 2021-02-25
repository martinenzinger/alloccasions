import * as uuid from 'uuid'

import { MailsAccess } from '../dataLayer/mailsAccess'
import { parseUserId } from '../auth/utils'
import { createLogger } from '../utils/logger'
import { HeaderInfo } from '../models/HeaderInfo';
import { MailItem } from '../models/MailItem';
import { CreateMailRequest } from '../requests/CreateMailRequest'

const mailsAccess = new MailsAccess();
const logger = createLogger('mails');

export async function sendGreetingCard(userName: string, mailItem: MailItem, cardPdf: Buffer): Promise<boolean> {
    const headerInfo: HeaderInfo = {
        senderName: userName,
        senderEmail: "ecard@alloccasions.us",
        recipientEmail: mailItem.recipient
    };
    let result;
    try {
        result = await mailsAccess.sendSESMail(mailItem, headerInfo, "eCard_AllOccasions.pdf", cardPdf);
    } catch(err) {
        logger.error("Unable to send mail. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Mail successfully sent: " + JSON.stringify(result, null, 2));
    return result;
}

export async function createMailItem(createMailRequest: CreateMailRequest, jwtToken: string): Promise<MailItem> {
    const userId = parseUserId(jwtToken)
    const mailItemData: MailItem = {
        userId: userId,
        mailId: uuid.v4(),
        createdAt: new Date().toISOString(),
        subject: createMailRequest.subject,
        sender: createMailRequest.sender,
        recipient: createMailRequest.recipient,
        card: createMailRequest.card
    }
    let mailItem;
    try {
        mailItem = await mailsAccess.createMailItem(mailItemData)
    } catch(err) {
        logger.error("Unable to create mail item. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Creating mail item succeeded: " + JSON.stringify(mailItem, null, 2));
    return mailItem;
}

export async function getMailItem(mailId: string, jwtToken: string): Promise<MailItem> {
    const userId = parseUserId(jwtToken)
    let mailItem;
    try {
        mailItem = await mailsAccess.getMailItem(mailId, userId);
    } catch(err) {
        logger.error("Unable to get mail item. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Fetching mail item succeeded: " + JSON.stringify(mailItem, null, 2));
    return mailItem;
}

export async function getMailItems(jwtToken: string): Promise<MailItem> {
    const userId = parseUserId(jwtToken)
    let mailItem;
    try {
        mailItem = await mailsAccess.getMailsForUser(userId);
    } catch(err) {
        logger.error("Unable to get mail items. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Fetching mail items succeeded: " + JSON.stringify(mailItem, null, 2));
    return mailItem;
}

export async function deleteMailItem(mailId: string, jwtToken: string): Promise<MailItem> {
    const userId = parseUserId(jwtToken)
    let mailItem;
    try {
        mailItem = await mailsAccess.deleteMailItem(mailId, userId);
    } catch(err) {
        logger.error("Unable to delete mail item. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Deleting mail item succeeded: " + JSON.stringify(mailItem, null, 2));
    return mailItem;
}