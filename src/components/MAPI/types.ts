import * as capiv1alpha3 from 'model/services/mapi/capiv1alpha3';
import * as capiexpv1alpha3 from 'model/services/mapi/capiv1alpha3/exp';
import * as capiv1alpha4 from 'model/services/mapi/capiv1alpha4';
import * as capzv1alpha3 from 'model/services/mapi/capzv1alpha3';
import * as capzexpv1alpha3 from 'model/services/mapi/capzv1alpha3/exp';
import * as capzv1alpha4 from 'model/services/mapi/capzv1alpha4';
import * as gscorev1alpha1 from 'model/services/mapi/gscorev1alpha1';
import * as infrav1alpha2 from 'model/services/mapi/infrastructurev1alpha2';
import * as infrav1alpha3 from 'model/services/mapi/infrastructurev1alpha3';

export type ControlPlaneNode =
  | capzv1alpha3.IAzureMachine
  | infrav1alpha2.IAWSControlPlane
  | infrav1alpha2.IG8sControlPlane
  | infrav1alpha3.IAWSControlPlane
  | infrav1alpha3.IG8sControlPlane;

export type ControlPlaneNodeList =
  | capzv1alpha3.IAzureMachineList
  | infrav1alpha2.IAWSControlPlaneList
  | infrav1alpha2.IG8sControlPlaneList
  | infrav1alpha3.IAWSControlPlaneList
  | infrav1alpha3.IG8sControlPlaneList;

export type Cluster = capiv1alpha3.ICluster;

export type ClusterList = capiv1alpha3.IClusterList;

export type ProviderCluster =
  | capzv1alpha3.IAzureCluster
  | infrav1alpha2.IAWSCluster
  | infrav1alpha3.IAWSCluster
  | undefined;

export type ProviderClusterList =
  | capzv1alpha3.IAzureClusterList
  | infrav1alpha2.IAWSClusterList
  | infrav1alpha3.IAWSClusterList;

export type NodePool =
  | capiv1alpha3.IMachineDeployment
  | capiexpv1alpha3.IMachinePool
  | capiv1alpha4.IMachinePool;

export type NodePoolList =
  | capiv1alpha3.IMachineDeploymentList
  | capiexpv1alpha3.IMachinePoolList
  | capiv1alpha4.IMachinePoolList;

export type ProviderNodePool =
  | capzexpv1alpha3.IAzureMachinePool
  | capzv1alpha4.IAzureMachinePool
  | infrav1alpha2.IAWSMachineDeployment
  | infrav1alpha3.IAWSMachineDeployment
  | undefined;

export type ProviderNodePoolList =
  | capzexpv1alpha3.IAzureMachinePoolList
  | capzv1alpha4.IAzureMachinePoolList
  | infrav1alpha2.IAWSMachineDeploymentList
  | infrav1alpha3.IAWSMachineDeploymentList;

export type BootstrapConfig = gscorev1alpha1.ISpark | undefined;
