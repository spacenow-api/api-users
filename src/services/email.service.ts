import axios from 'axios';

import * as config from './../config';

class EmailService {

  public send(templateName: string, destination: string, templateData: object) {
    axios.post(`${config.apiEmails}/email/send`, {
      template: templateName,
      destination,
      data: JSON.stringify(templateData)
    }).then(({ data }) => {
      console.info(`Email '${templateName}' send with success to '${destination}'.\nMessage ID: ${data.MessageId}`)
    }).catch((err) => {
      console.error(`Problems to send email '${templateName}' to '${destination}'.\nError: `, err)
    })
  }
}

export default EmailService;