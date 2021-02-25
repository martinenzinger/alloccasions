import { History } from 'history'
import * as React from 'react'

import { createMailItem, sendMail } from '../api/greeting-card-api'
import Auth from '../auth/Auth'

const snackbar = require('snackbar');

interface GreetingCardProps {
  auth: Auth
  history: History
}

interface GreetingCardState {
  subject: string
  userName: string
  recipient: string
  selectedCard: string
}

export class GreetingCards extends React.PureComponent<GreetingCardProps, GreetingCardState> {
  state: GreetingCardState = {
    subject: "",
    userName: "",
    recipient: "",
    selectedCard: ""
  }

  handleSelect = (cardId: string) => {
    this.setState({
      selectedCard: cardId
    })
  }

  handleSubjectChange = (evt: any) => {
    this.setState({
      subject: evt.target.value
    });
  }

  handleRecipientChange = (evt: any) => {
    this.setState({
      recipient: evt.target.value
    });
  }

  onSendMail = async (evt: React.MouseEvent) => {
    const buttonElement = evt.target as HTMLInputElement;
    buttonElement.classList.add('sending');
    buttonElement.value = "✉️";
    try {
      if (!this.state.subject || !this.state.recipient || !this.state.selectedCard) throw Error("missing information.");
      const userProfile: any = await this.props.auth.getUserProfile();
      console.log("user profile ", userProfile);
      const response = await createMailItem(this.props.auth.getIdToken(), {
        subject: this.state.subject,
        sender: "ecard@alloccasions.us",
        recipient: this.state.recipient,
        card: this.state.selectedCard
      })
      console.log("create mail item response ", response);
      const mailSent = await sendMail(this.props.auth.getIdToken(), {
        mailId: response.response.mailId,
        userName: userProfile.nickname
      })
      if (!mailSent) throw Error();
    } catch (err) {
      buttonElement.classList.remove('sending');
      buttonElement.value = "Send Card";
      console.error(err);
      snackbar.show("ERROR: An error occured while sending the email.");
      return;
    }
    buttonElement.classList.remove('sending');
    buttonElement.value = "Send Card";
    snackbar.show("Mail successfully sent!");
  }

  render() {
    return (
      <div className="card-content">
        <h1>Greeting Cards</h1>

        {this.renderGreetingCards()}

        {this.renderSendCardInput()}
      </div>
    )
  }

  renderSendCardInput() {
    return (
      <div className="send-card-form">
        <div><label>Subject</label><input type="text" className="" onChange={this.handleSubjectChange}/></div>
        <div><label>Recipient</label><input type="email" className="" onChange={this.handleRecipientChange}/></div>
        <div><input type="submit" value="Send Card" onClick={(evt) => this.onSendMail(evt)}/></div>
      </div>
    )
  }

  renderGreetingCards() {
    return (
      <div className="card-container">
        {["card01","card02","card03"].map((imageId, pos) => {
          return (
            <div key={pos} className="card-container__image-element">
              <label htmlFor={imageId} className="">
                <input type="radio"
                  className=""
                  name="image-select-radios"
                  id={imageId}
                  onClick={() => this.handleSelect(imageId)}/>
                <div className="card-container__image-wrapper">
                  <img src={'img/' + imageId + '.png'}/>
                </div>
              </label>
            </div>
          )
        })}
      </div>
    )
  }
}
