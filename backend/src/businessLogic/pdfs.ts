
import { BucketAccess } from '../dataLayer/bucketAccess';
import { createLogger } from '../utils/logger';

const bucketAccess = new BucketAccess()
const logger = createLogger('certificates');

export async function readPdfFile(pdfKey: string): Promise<Buffer> {
    let pdfBuffer;
    try {
        pdfBuffer = await bucketAccess.readFile(pdfKey);
    } catch(err) {
        logger.error("Unable to read PDF file. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Succesfully read PDF file: " + pdfKey);
    return pdfBuffer;
}

export async function generateSignedUrl(fileKey: string): Promise<string> {
    let signedPdfUrl;
    try {
        signedPdfUrl = await bucketAccess.generateSignedUrl(fileKey);
    } catch(err) {
        logger.error("Unable to generate signed Url for PDF file. Error JSON: " + err.toString());
        throw err;
    }
    logger.info("Succesfully generated signed Url for PDF.");
    return signedPdfUrl;
}
