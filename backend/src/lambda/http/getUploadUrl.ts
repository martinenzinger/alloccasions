import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { generateSignedUrl } from '../../businessLogic/pdfs'
import { parseUserId } from '../../auth/utils'


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const userId = parseUserId(jwtToken);

  const fileKey = "card_" + Date.now() + ".pdf";

  let signedPutUrl;

  try {
    signedPutUrl = await generateSignedUrl(userId + "/" + fileKey);
  } catch(err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Unable to create mail item.',
        error: err
      })
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      url: signedPutUrl,
      key: fileKey
    })
  }
}