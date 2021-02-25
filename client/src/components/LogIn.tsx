import * as React from 'react'
import Auth from '../auth/Auth'

interface LogInProps {
  auth: Auth
}

interface LogInState {}

export class LogIn extends React.PureComponent<LogInProps, LogInState> {
  onLogin = () => {
    this.props.auth.login()
  }

  render() {
    return (
      <div>
        <h1>Please log in</h1>

        <button className="login-button" onClick={this.onLogin}>
          Log in
        </button>
      </div>
    )
  }
}
