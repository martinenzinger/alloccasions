import React, { Component } from 'react'
import { Route, Router, Switch } from 'react-router-dom'

import Auth from './auth/Auth'
import { Confirm } from './components/Confirm'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { GreetingCards } from './components/GreetingCards'
import { SentMails } from './components/SentMails'

export interface AppProps {}

export interface AppProps {
  auth: Auth
  history: any
}

export interface AppState {}

export default class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)

    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
  }

  handleLogin() {
    this.props.auth.login()
  }

  handleLogout() {
    this.props.auth.logout()
  }

  render() {
    return (
        <section style={{ padding: '8em 15%' }}>
          <div className="container">
            <Router history={this.props.history}>
              {this.generateMenu()}

              {this.generateCurrentPage()}
            </Router>
          </div>
        </section>
    )
  }

  generateMenu() {
    return (
      <div className="app-header">
        <div className="app-header__logo"><img src="img/logo.svg"/></div>
        <div className="app-header__button">{this.logInLogOutButton()}</div>
      </div>
    )
  }

  logInLogOutButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <a onClick={this.handleLogout}>
          Log Out
        </a>
      )
    } else {
      return (
        <a onClick={this.handleLogin}>
          Log In
        </a>
      )
    }
  }

  generateCurrentPage() {
    if (!this.props.auth.isAuthenticated()) {
      return <LogIn auth={this.props.auth} />
    }

    return (
      <Switch>
        <Route
          path="/"
          exact
          render={props => {
            return (<div>
                <GreetingCards {...props} auth={this.props.auth} />
                <SentMails {...props} auth={this.props.auth} />
              </div>
            )
          }}
        />

        <Route
          path="/sent"
          exact
          render={props => {
            return <Confirm {...props} auth={this.props.auth} />
          }}
        />

        <Route component={NotFound} />
      </Switch>
    )
  }
}
