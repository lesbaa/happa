import { render } from '@testing-library/react';
import App from 'App';
import { ConnectedRouter } from 'connected-react-router';
import { createMemoryHistory } from 'history';
import CPAuth from 'lib/CPAuth/CPAuth';
import React from 'react';
import { Provider } from 'react-redux';
import { MainRoutes } from 'shared/constants/routes';
import configureStore from 'stores/configureStore';
import { ThemeProvider } from 'styled-components';
import theme from 'styles/theme';

export const initialStorage = {
  user:
    '{"email":"developer@giantswarm.io","auth":{"scheme":"giantswarm","token":"a-valid-token"},"isAdmin":true}',
};

/**
 * This function will render the whole app with a mocked store in the route
 * provided.
 * @param {String} initialRoute - The route to load.
 * @param {Object} state - The initial store state.
 * @param {Object} storage - The initial local storage state.
 * @param {CPAuth} cpAuth Control Plane API handler.
 */
export function renderRouteWithStore(
  initialRoute = MainRoutes.Home,
  state = {},
  storage = initialStorage,
  cpAuth = CPAuth.getInstance()
) {
  localStorage.replaceWith(storage);

  const history = createMemoryHistory({
    initialEntries: [initialRoute],
    initialIndex: 0,
  });

  const store = configureStore(state, history, cpAuth);

  const app = render(<App {...{ store, theme, history }} />);

  return app;
}

/**
 * Render component in the Theme context
 * @param {React.ElementType} component The React Component
 * @param {Object} props Props to pass to the component
 * @param {Object} [options] Testing library render options
 */
export function renderWithTheme(component, props, options) {
  return render(getComponentWithTheme(component, props), options);
}

/**
 * Include component in the Theme context and return it
 * @param {React.ReactType} Component The React Component
 * @param {Object} props Props to pass to the component
 */
export function getComponentWithTheme(Component, props) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...props} />
    </ThemeProvider>
  );
}

/**
 * Render component in the Store context
 * @param {React.ReactType} component The React Component
 * @param {Object} [props] Props to pass to the component
 * @param {Record<string, any>} [state] Current Store state
 * @param {<Q extends TestingLibrary.Queries>TestingLibrary.RenderOptions<Q>} [options] Testing library render options
 */
export function renderWithStore(component, props, state, options) {
  return render(getComponentWithStore(component, props, state), options);
}

/**
 * Include component in the Store context and return it
 * @param {React.ReactType} Component The React Component
 * @param {Object} props Props to pass to the component
 * @param {Record<string, any>} state Current Store state
 * @param {Record<string, any>} storage Current LocalStorage value
 * @param {History<any>} history Current Browser history
 * @param {CPAuth} cpAuth Control Plane API handler.
 */
export function getComponentWithStore(
  Component,
  props = {},
  state = {},
  storage = initialStorage,
  history = createMemoryHistory(),
  cpAuth = CPAuth.getInstance()
) {
  localStorage.replaceWith(storage);

  const store = configureStore(state, history, cpAuth);

  const app = (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ConnectedRouter history={history}>
          <Component {...props} />
        </ConnectedRouter>
      </ThemeProvider>
    </Provider>
  );

  return app;
}
