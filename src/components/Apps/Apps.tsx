import { AppsRoutes } from 'model/constants/routes';
import React from 'react';
import { Breadcrumb } from 'react-breadcrumbs';
import { Switch } from 'react-router-dom';
import Route from 'Route';

import AppDetail from './AppDetail/AppDetail';
import AppsList from './AppsList/AppsList';

const Apps: React.FC = () => {
  return (
    <Breadcrumb
      data={{
        title: 'Apps'.toUpperCase(),
        pathname: AppsRoutes.Home,
      }}
    >
      <Switch>
        <Route exact={true} path={AppsRoutes.AppDetail} component={AppDetail} />
        <Route path={AppsRoutes.Home} component={AppsList} />
      </Switch>
    </Breadcrumb>
  );
};

export default Apps;
