import * as React from 'react'
import Auth from '../auth/Auth'

interface ConfirmProps {
  auth: Auth
}

interface ConfirmState {}

export class Confirm extends React.PureComponent<ConfirmProps, ConfirmState> {

  render() {
    return (
      <div>
        <h1>Mail sent!</h1>
      </div>
    )
  }
}
