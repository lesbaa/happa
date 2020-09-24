import * as types from 'actions/actionTypes';
import produce from 'immer';
import {
  GLOBAL_LOAD_ERROR,
  GLOBAL_LOAD_SUCCESS,
} from 'stores/global/constants';
import {
  ORGANIZATION_LOAD_SUCCESS,
  ORGANIZATION_SELECT,
} from 'stores/organization/constants';
import {
  INFO_LOAD_SUCCESS,
  LOGIN_ERROR,
  LOGIN_SUCCESS,
  LOGOUT_ERROR,
  LOGOUT_SUCCESS,
  REFRESH_USER_INFO_ERROR,
  REFRESH_USER_INFO_SUCCESS,
} from 'stores/user/constants';
import {
  fetchSelectedOrganizationFromStorage,
  fetchUserFromStorage,
  removeUserFromStorage,
  setUserToStorage,
} from 'utils/localStorageUtils';

const initialState = () => ({
  selectedOrganization: fetchSelectedOrganizationFromStorage(),
  selectedClusterID: undefined,
  firstLoadComplete: false,
  loggedInUser: fetchUserFromStorage(),
  info: {
    general: {
      availability_zones: {
        default: 0,
        max: 0,
      },
      provider: '',
    },
  },
});

const makeAppReducer = () => {
  return produce((draft, action) => {
    switch (action.type) {
      case REFRESH_USER_INFO_SUCCESS: {
        const newUser = Object.assign({}, draft.loggedInUser, {
          email: action.email,
        });
        setUserToStorage(newUser);

        draft.loggedInUser = newUser;

        break;
      }

      case INFO_LOAD_SUCCESS:
        draft.info = action.info;

        break;

      case LOGIN_SUCCESS: {
        setUserToStorage(action.userData);

        draft.loggedInUser = action.userData;

        break;
      }

      case REFRESH_USER_INFO_ERROR:
      case LOGIN_ERROR:
      case LOGOUT_SUCCESS:
      case LOGOUT_ERROR:
        removeUserFromStorage();

        draft.loggedInUser = {};
        draft.firstLoadComplete = false;

        break;

      case GLOBAL_LOAD_ERROR:
      case GLOBAL_LOAD_SUCCESS:
        draft.firstLoadComplete = true;

        break;

      case ORGANIZATION_SELECT:
        draft.selectedOrganization = action.orgId;

        break;

      case ORGANIZATION_LOAD_SUCCESS:
        draft.selectedOrganization = action.selectedOrganization;

        break;

      case types.CLUSTER_SELECT:
        draft.selectedClusterID = action.clusterID;

        break;
    }
  }, initialState());
};

export default makeAppReducer;
