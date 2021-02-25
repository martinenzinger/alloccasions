import * as React from 'react'
import { deleteMailItem, getMailItemsForUser } from '../api/greeting-card-api'
import Auth from '../auth/Auth'
import { MailItem } from '../types/MailItem'

interface SentMailsProps {
  auth: Auth
}

interface SentMailsState {
    mailItems: MailItem[]
    loadingMailItems: boolean
}

export class SentMails extends React.PureComponent<SentMailsProps, SentMailsState> {
  state: SentMailsState = {
    mailItems: [],
    loadingMailItems: true
  }

  onMailItemDelete = async (mailId: string) => {
    try {
      await deleteMailItem(this.props.auth.getIdToken(), mailId)
      this.setState({
        mailItems: this.state.mailItems.filter(mailItem => mailItem.mailId != mailId)
      })
    } catch {
      alert('Mail item deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const mailItems = await getMailItemsForUser(this.props.auth.getIdToken())
      this.setState({
        mailItems,
        loadingMailItems: false
      })
    } catch (e) {
      alert(`Failed to fetch mail items: ${e.message}`)
    }
  }

  render() {
    if (this.state.loadingMailItems) {
        return this.renderLoading()
    }
    return (
      <div className="card-content">
        <h1>Sent Mails</h1>

        {this.renderSentMails()}

      </div>
    )
  }

  renderLoading() {
    return (
        <div className="loading-mail-items">
            Loading sent mails...
        </div>
    )
  }

  renderSentMails() {
    return (
      <div className="mail-item__content">
        {this.state.mailItems.map((mailItem, pos) => {
          return (
            <div key={mailItem.mailId} className="mail-item__row">
              <div className="mail-item__cell">
                {mailItem.createdAt}
              </div>
              <div className="mail-item__cell">
                {mailItem.recipient}
              </div>
              <div className="mail-item__cell">
                {mailItem.subject}
              </div>
              <div className="mail-item__cell">
                <button
                  className="mail-item__delete-button"
                  onClick={() => this.onMailItemDelete(mailItem.mailId)}>
                  <img className="mail-item__delete-icon" src="img/delete.svg"/>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}