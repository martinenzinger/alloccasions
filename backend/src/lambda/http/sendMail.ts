import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { getMailItem, sendGreetingCard } from '../../businessLogic/mails'
import { readPdfFile } from '../../businessLogic/pdfs'


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authorization = event.headers.Authorization
  const eventBody = JSON.parse(event.body);
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const mailId = eventBody.mailId;
  const userName = eventBody.userName;

  let mailItem, attachmentBuffer, result;

  try {
    mailItem = await getMailItem(mailId, jwtToken);
    attachmentBuffer = await readPdfFile(mailItem.card + ".pdf");
    result = await sendGreetingCard(userName, mailItem, attachmentBuffer);
  } catch(err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Unable to send mail.',
        error: err
      })
    }
  }

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      result: result
    })
  }
}