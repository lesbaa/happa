import styled from '@emotion/styled';
import DocumentTitle from 'components/shared/DocumentTitle';
import ClusterStatus from 'Home/ClusterStatus';
import { relativeDate } from 'lib/helpers';
import RoutePath from 'lib/routePath';
import { compare } from 'lib/semver';
import PropTypes from 'prop-types';
import React from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { Providers } from 'shared/constants';
import { OrganizationsRoutes } from 'shared/constants/routes';
import * as organizationActions from 'stores/organization/actions';
import { Ellipsis } from 'styles';
import ClusterIDLabel from 'UI/ClusterIDLabel';
import Section from 'UI/Section';

import Credentials from './Credentials';

const MembersTable = styled.div`
  .member-email {
    ${Ellipsis}
  }
`;

const Disclaimer = styled.p`
  margin: 0 0 20px;
  line-height: 1.2;
`;

const clusterTableDefaultSorting = [
  {
    dataField: 'id',
    order: 'asc',
  },
];

const memberTableDefaultSorting = [
  {
    dataField: 'email',
    order: 'asc',
  },
];

class OrganizationDetail extends React.Component {
  static supportsBYOC(provider) {
    if (provider === Providers.AWS || provider === Providers.AZURE) {
      return true;
    }

    return false;
  }

  addMember = () => {
    this.props.actions.organizationAddMember(this.props.organization.id);
  };

  removeMember = (email) => {
    this.props.actions.organizationRemoveMember(
      this.props.organization.id,
      email
    );
  };

  deleteOrganization = () => {
    this.props.actions.organizationDelete(this.props.organization.id);
  };

  // Provides the configuraiton for the clusters table
  getClusterTableColumnsConfig = () => {
    return [
      {
        dataField: 'id',
        text: 'Cluster ID',
        sort: true,
        formatter: clusterIDCellFormatter.bind(this),
      },
      {
        dataField: 'name',
        text: 'Name',
        sort: true,
        formatter: (cell, row) =>
          formatClusterName(cell, row, this.props.organization.id),
      },
      {
        dataField: 'release_version',
        text: 'Release',
        sort: true,
        sortFunc: (a, b, order) => {
          if (order === 'desc') {
            return compare(a, b) * -1;
          }

          return compare(a, b);
        },
      },
      {
        dataField: 'create_date',
        text: 'Created',
        sort: true,
        formatter: relativeDate,
      },
      {
        dataField: 'delete_date',
        text: 'Deleted',
        sort: true,
        formatter: relativeDate,
      },
      {
        dataField: 'actionsDummy',
        isDummyField: true,
        text: '',
        align: 'right',
        formatter: clusterActionsCellFormatter.bind(this),
      },
    ];
  };
  // Provides the configuraiton for the org members table
  getMemberTableColumnsConfig = () => {
    return [
      {
        dataField: 'email',
        text: 'Email',
        sort: true,
        attrs: {
          'data-testid': 'organization-member-email',
          className: 'member-email',
        },
      },
      {
        dataField: 'emailDomain',
        text: 'Email Domain',
        sort: true,
      },
      {
        dataField: 'actionsDummy',
        isDummyField: true,
        text: '',
        align: 'right',
        formatter: memberActionsCellFormatter.bind(this),
      },
    ];
  };

  render() {
    const { clusters, organization } = this.props;
    if (!organization) return null;

    const { provider } = this.props.app.info.general;
    const supportsBYOC = OrganizationDetail.supportsBYOC(provider);

    const newClusterPath = RoutePath.createUsablePath(
      OrganizationsRoutes.Clusters.New,
      { orgId: organization.id }
    );

    return (
      <DocumentTitle title={`Organization Details | ${organization.id}`}>
        <h1>Organization: {organization.id}</h1>
        <Section title='Clusters'>
          {clusters.length === 0 ? (
            <p>This organization doesn&apos;t have any clusters.</p>
          ) : (
            <BootstrapTable
              bordered={false}
              columns={this.getClusterTableColumnsConfig()}
              data={clusters}
              defaultSortDirection='asc'
              defaultSorted={clusterTableDefaultSorting}
              keyField='id'
            />
          )}
          <Link to={newClusterPath}>
            <Button bsStyle='default'>
              <i className='fa fa-add-circle' /> Create Cluster
            </Button>
          </Link>
        </Section>

        <Section title='Members'>
          <MembersTable>
            {organization.members.length === 0 ? (
              <p>This organization has no members</p>
            ) : (
              <BootstrapTable
                bordered={false}
                columns={this.getMemberTableColumnsConfig()}
                data={this.props.membersForTable}
                defaultSortDirection='asc'
                defaultSorted={memberTableDefaultSorting}
                keyField='email'
              />
            )}
            <Button bsStyle='default' onClick={this.addMember}>
              <i className='fa fa-add-circle' /> Add Member
            </Button>
          </MembersTable>
        </Section>

        {supportsBYOC && (
          <Section title='Provider credentials'>
            <Credentials organizationName={organization.id} />
          </Section>
        )}

        <Section title='Delete This Organization' flat>
          <Disclaimer>
            All information related to this organization will be deleted. There
            is no way to undo this action.
          </Disclaimer>
          <Button bsStyle='danger' onClick={this.deleteOrganization}>
            <i className='fa fa-delete' /> Delete Organization
          </Button>
        </Section>
      </DocumentTitle>
    );
  }
}

OrganizationDetail.propTypes = {
  actions: PropTypes.object,
  clusters: PropTypes.array,
  organization: PropTypes.object,
  app: PropTypes.object,
  membersForTable: PropTypes.array,
};

// eslint-disable-next-line react/no-multi-comp
function clusterIDCellFormatter(cell) {
  return <ClusterIDLabel clusterID={cell} copyEnabled />;
}

// eslint-disable-next-line react/no-multi-comp
function formatClusterName(_, cluster, orgId) {
  const clusterDetailPath = RoutePath.createUsablePath(
    OrganizationsRoutes.Clusters.Detail.Home,
    {
      orgId,
      clusterId: cluster.id,
    }
  );

  return (
    <>
      {cluster.name}{' '}
      <Link to={clusterDetailPath}>
        <ClusterStatus clusterId={cluster.id} hideText={true} />
      </Link>
    </>
  );
}

// eslint-disable-next-line react/no-multi-comp
function clusterActionsCellFormatter(_cell, row) {
  if (row.delete_date) {
    return <span />;
  }

  const clusterDetailPath = RoutePath.createUsablePath(
    OrganizationsRoutes.Clusters.Detail.Home,
    {
      // eslint-disable-next-line react/no-this-in-sfc
      orgId: this.props.organization.id,
      clusterId: row.id,
    }
  );

  return (
    <Link to={clusterDetailPath}>
      <Button bsStyle='default' type='button'>
        Details
      </Button>
    </Link>
  );
}

// eslint-disable-next-line react/no-multi-comp
function memberActionsCellFormatter(_cell, row) {
  return (
    <Button
      // eslint-disable-next-line react/no-this-in-sfc
      onClick={this.removeMember.bind(this, row.email)}
      type='button'
      data-testid='organization-member-remove'
    >
      Remove
    </Button>
  );
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(organizationActions, dispatch),
  };
}

export default connect(undefined, mapDispatchToProps)(OrganizationDetail);
