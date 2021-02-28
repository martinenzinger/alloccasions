import { apiEndpoint } from '../config'
import Axios from 'axios'
import { CreateMailRequest } from '../types/CreateMailRequest';
import { CreateMailResponse } from '../types/CreateMailResponse';
import { SendMailRequest } from '../types/SendMailRequest';
import { MailItem } from '../types/MailItem';


export async function getMailItemsForUser(idToken: string): Promise<MailItem[]> {
  console.log('Fetching mail items')
  const response = await Axios.get(`${apiEndpoint}/sentmails`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('Mail items:', response.data)
  return response.data.items
}

export async function createMailItem(
  idToken: string,
  mailItem: CreateMailRequest
): Promise<CreateMailResponse> {
  const response = await Axios.post(`${apiEndpoint}/create`,  JSON.stringify(mailItem), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data
}

export async function deleteMailItem(
  idToken: string,
  mailId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/sentmails/${mailId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function uploadCard(
  idToken: string,
  pdfFile: File
): Promise<string> {
  const urlResponse = await Axios.get(`${apiEndpoint}/uploadurl`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('Pre-signed Url:', urlResponse.data)

  const response = await Axios.put(urlResponse.data.url, pdfFile, {
    headers: {
      'Content-Type': pdfFile.type
    }
  })
  return urlResponse.data.key;
}

export async function sendMail(
  idToken: string,
  mailInfo: SendMailRequest
): Promise<boolean> {
  try {
    await Axios.post(`${apiEndpoint}/send`, JSON.stringify(mailInfo), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    })
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}
