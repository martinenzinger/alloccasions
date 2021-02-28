
import { parseUserId } from '../auth/utils';
import { BucketAccess } from '../dataLayer/bucketAccess';
import { createLogger } from '../utils/logger';

const bucketAccess = new BucketAccess()
const logger = createLogger('certificates');

export async function readCardFile(card: string, jwtToken: string): Promise<Buffer> {
    let pdfBuffer, pdfKey;
    try {
        if (card.indexOf(".pdf") === -1) {
            pdfKey = card + ".pdf";
        } else {
            pdfKey = parseUserId(jwtToken) + "/" + card;
        }
        pdfBuffer = await bucketAccess.readFile(pdfKey);
    } catch(err) {
        logger.error("Unable to read card PDF file. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Succesfully read card PDF file: " + pdfKey);
    return pdfBuffer;
}

export async function savePdf(fileName: string, pdfBuffer: Buffer, jwtToken: string): Promise<string> {
    const userId = parseUserId(jwtToken)
    let pdfUrl;
    try {
        pdfUrl = await bucketAccess.uploadBuffer(userId + "/" + fileName, pdfBuffer);
    } catch(err) {
        logger.error("Unable to save PDF file. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Succesfully saved PDF file: " + pdfUrl);
    return pdfUrl;
}

export async function generateSignedUrl(fileKey: string): Promise<string> {
    let signedPdfUrl;
    try {
        signedPdfUrl = await bucketAccess.putObjectSignedUrl(fileKey);
    } catch(err) {
        logger.error("Unable to generate signed Url for PDF file. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Succesfully generated signed Url for PDF.");
    return signedPdfUrl;
}
