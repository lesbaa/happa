import { IHttpClient } from 'model/clients/HttpClient';
import * as k8sUrl from 'model/services/mapi/k8sUrl';
import { IOAuth2Provider } from 'utils/OAuth2/OAuth2';

import { createResource } from '../generic/createResource';
import { IAWSCluster } from './';

export function createAWSCluster(
  client: IHttpClient,
  auth: IOAuth2Provider,
  awsCluster: IAWSCluster
) {
  const url = k8sUrl.create({
    baseUrl: window.config.mapiEndpoint,
    apiVersion: 'infrastructure.giantswarm.io/v1alpha3',
    kind: 'awsclusters',
    namespace: awsCluster.metadata.namespace!,
    name: awsCluster.metadata.name,
  } as k8sUrl.IK8sCreateOptions);

  return createResource<IAWSCluster>(client, auth, url.toString(), awsCluster);
}
