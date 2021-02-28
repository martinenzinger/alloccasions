import { History } from 'history'
import * as React from 'react'
import { jsPDF } from 'jspdf'

import { createMailItem, sendMail, uploadCard } from '../api/greeting-card-api'
import { CardEditor } from './CardEditor'
import Auth from '../auth/Auth'

const snackbar = require('snackbar')

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

  handleSelectCustom = () => {
    this.setState({
      selectedCard: "custom"
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

    let cardFile = this.state.selectedCard;

    if (this.state.selectedCard === "custom") {
      try {
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [900, 640]
        });
        const c = document.getElementById("card-editor") as HTMLCanvasElement;
        var dataUrl = c.toDataURL("image/jpeg", 1.0);
        doc.addImage(dataUrl, 'JPEG', 0, 0, 900, 640);
        var pdfBlob = doc.output('blob');
        let pdfFile: any = pdfBlob;
        pdfFile.lastModifiedDate = new Date();
        pdfFile.name = "custom_card.pdf";
        const fileKey = await uploadCard(this.props.auth.getIdToken(), pdfFile);
        console.log("key for uploaded file", fileKey);
        cardFile = fileKey;
      } catch (err) {
        buttonElement.classList.remove('sending');
        buttonElement.value = "Send Card";
        console.error(err);
        snackbar.show("ERROR: An error occured while uploading your custom card.");
        return;
      } 
    }

    try {
      if (!this.state.subject || !this.state.recipient || !this.state.selectedCard) throw Error("missing information.");
      const userProfile: any = await this.props.auth.getUserProfile();
      console.log("user profile ", userProfile);
      const response = await createMailItem(this.props.auth.getIdToken(), {
        subject: this.state.subject,
        sender: "ecard@alloccasions.us",
        recipient: this.state.recipient,
        card: cardFile
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

        {this.state.selectedCard === "custom" ? this.renderCustomCardEditor() : ""}

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

  renderCustomCardEditor() {
    return (
      <div className="custom-card-editor">
        <CardEditor auth={this.props.auth}></CardEditor>
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
        <div key="custom" className="card-container__image-element">
          <label htmlFor="custom-card" className="">
            <input type="radio"
              className=""
              name="image-select-radios"
              id="custom-card"
              onClick={() => this.handleSelectCustom()}/>
            <div className="card-container__image-wrapper">
              <img src={'img/custom.png'}/>
            </div>
          </label>
        </div>
      </div>
    )
  }
}
