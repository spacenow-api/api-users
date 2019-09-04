import axios from 'axios';

import * as config from './../config';

class EmailService {

  public async send(templateName: string, destination: string, templateData: object) {
    const { data }: any = await axios.post(`${config.apiEmails}/email/send`, {
      template: templateName,
      data: JSON.stringify({ email: destination, ...templateData })
    })
    if (data) {
      console.info(`Email '${templateName}' send with success to '${destination}'.\nMessage ID: ${data.MessageId}`)
    }
  }
}

export default EmailService;