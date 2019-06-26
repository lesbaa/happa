import 'babel-polyfill';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import { Route, Switch } from 'react-router-dom';
import AdminLogin from './auth/admin';
import configureStore from '../stores/configureStore';
import ForgotPassword from './forgot_password/index';
import history from '../stores/history';
import Layout from './layout';
import Login from './auth/login';
import Logout from './auth/logout';
import OAuthCallback from './auth/oauth_callback.js';
import React from 'react';
import SetPassword from './forgot_password/set_password';
import SignUp from './signup/index';

// CSS Imports
// Keep the blank lines to allow for a certain ordering!

import 'normalize.css';

import 'bootstrap/dist/css/bootstrap.min.css';

import '../styles/app.sass';
import 'noty/lib/noty.css';
import 'react-datepicker/dist/react-datepicker.css';

var appContainer = document.getElementById('app');

const store = configureStore({});

history.listen(() => {
  window.scrollTo(0, 0);
});

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div>
        <Switch>
          <Route component={AdminLogin} path='/admin-login' />
          <Route component={Login} path='/login' />
          <Route component={Logout} path='/logout' />
          <Route component={SetPassword} path='/forgot_password/:token/' />
          <Route component={ForgotPassword} path='/forgot_password' />
          <Route component={SignUp} path='/signup/:token' />
          <Route component={OAuthCallback} path='/oauth/callback' />

          <Route component={Layout} path='/' />
        </Switch>
      </div>
    </ConnectedRouter>
  </Provider>,
  appContainer
);
