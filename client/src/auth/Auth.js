import auth0 from 'auth0-js';
import { authConfig } from '../config';

export default class Auth {

  auth0 = new auth0.WebAuth({
    domain: authConfig.domain,
    clientID: authConfig.clientId,
    redirectUri: authConfig.callbackUrl,
    responseType: 'token id_token',
    audience: `https://${authConfig.domain}/api/v2/`,
    scope: 'openid read:current_user update:current_user_metadata'
  });
  

  constructor(history) {
    this.history = history;

    this.accessToken = '';
    this.idToken = '';
    this.expiresAt = '';
    this.expiresAt = '';
    this.userInfo = null;
    this.userProfile = null;
    this.auth0mgmt = null;

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getIdToken = this.getIdToken.bind(this);
    this.renewSession = this.renewSession.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.saveUserProfile = this.saveUserProfile.bind(this);
    this.setUserInfo = this.setUserInfo.bind(this);
    this.setUserProfile = this.setUserProfile.bind(this);
  }

  login() {
    this.auth0.authorize();
  }

  handleAuthentication() {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        console.log('Access token: ', authResult.accessToken)
        console.log('id token: ', authResult.idToken)
        this.setSession(authResult);
      } else if (err) {
        this.history.replace('/');
        console.log(err);
        alert(`Error: ${err.error}. Check the console for further details.`);
      }
    });
  }

  getUserProfile() {

    return new Promise((resolve, reject) => {
      if (this.userProfile) {
        console.log('profile set.');
        return;
      }
      if (!this.userInfo) {
        console.log('not logged in.');
        return;
      }

      // some management api scopes can be granted with the user credentials
      // https://auth0.com/docs/tokens/management-api-access-tokens/get-management-api-tokens-for-single-page-applications
      // most of them require a backend-api in the middle

      
      // audience: 'https://' + authConfig.domain + '/api/v2',
      // scope: 'read:current_user update:current_user_metadata',
      // responseType: 'token'

      var that = this;
      this.auth0mgmt.getUser(this.userInfo.sub, function(err, userProfile) {
          if (userProfile) {
              if (userProfile.user_metadata) {
                  that.setUserProfile(userProfile);
              }
              resolve(userProfile);
          } else if (err) {
              console.log(err);
              reject(err);
              alert(`Error: ${err.error}. Check the console for further details.`);
          }
      });
    });
  }

  saveUserProfile() {
    this.auth0mgmt.patchUserMetadata(this.userInfo.sub, {testdata: "testvalue", signatureName: "Tester Lease"}, function(err, userProfile) {
        if (userProfile) {
            console.log("user profile", userProfile);
        } else if (err) {
            console.log(err);
            alert(`Error: ${err.error}. Check the console for further details.`);
        }
    })
  }

  getAccessToken() {
    return this.accessToken;
  }

  getIdToken() {
    return this.idToken;
  }

  setUserInfo(user) {
      this.userInfo = user;
  }

  setUserProfile(userProfile) {
    this.userProfile = userProfile;
  }

  setSession(authResult) {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');

    // Set the time that the access token will expire at
    let expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    this.expiresAt = expiresAt;

    this.auth0mgmt = this.auth0mgmt || new auth0.Management({
        domain: authConfig.domain,
        token: authResult.accessToken
    });

    var that = this;
    this.auth0.client.userInfo(this.accessToken, function(err, user) {
        if (user) {
          console.log("user", user);
          that.setUserInfo(user);
        } else if (err) {
          console.log(err);
          alert(`Error: ${err.error}. Check the console for further details.`);
        }
      });

    // navigate to the home route
    this.history.replace('/');
  }

  renewSession() {
    this.auth0.checkSession({}, (err, authResult) => {
       if (authResult && authResult.accessToken && authResult.idToken) {
         this.setSession(authResult);
       } else if (err) {
         this.logout();
         console.log(err);
         alert(`Could not get a new token (${err.error}: ${err.error_description}).`);
       }
    });
  }

  logout() {
    // Remove tokens and expiry time
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');

    this.auth0.logout({
      return_to: window.location.origin
    });

    // navigate to the home route
    this.history.replace('/');
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    let expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }
}
