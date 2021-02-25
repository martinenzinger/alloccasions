import { JwtPayload } from './JwtPayload'
import { Jwt } from './Jwt'
import { verify, decode } from 'jsonwebtoken'
import Axios from 'axios'
import { createLogger } from '../utils/logger'

const logger = createLogger('auth')
const jwksUrl = process.env.JWKS_URL

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string {
  const decodedJwt = decode(jwtToken) as JwtPayload
  return decodedJwt.sub
}

export async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  const { header } = jwt;

  if ( !header || header.alg !== 'RS256' ) {
    throw new Error( 'Token is not RS256 encoded' );
  }

  const key = await getSigningKey(header.kid);

  let result;
  try {
    result = verify(token, key, { algorithms: ['RS256'] }) as JwtPayload
  } catch(err) {
    logger.error('User not authorized: ' + { error: err.message })
    throw err;
  }
  logger.info('User was authorized: ' + result)
  return result
}

export function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

export async function getSigningKey(kid): Promise<string> {
  let result;
  try {
    result = await Axios.get(jwksUrl);
  } catch(err) {
    return 'Error: ' + err;
  }

  const keys = result.data.keys;
  const signingKeys = keys
  .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
              && key.kty === 'RSA' // We are only supporting RSA (RS256)
              && key.kid           // The `kid` must be present to be useful for later
              && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
  ).map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
  });

  const signingKey = signingKeys.find(key => key.kid === kid);

  return signingKey.publicKey || signingKey.rsaPublicKey;
}

export function certToPEM( cert ) {
  let pem = cert.match( /.{1,64}/g ).join( '\n' );
  pem = `-----BEGIN CERTIFICATE-----\n${ cert }\n-----END CERTIFICATE-----\n`;
  return pem;
}