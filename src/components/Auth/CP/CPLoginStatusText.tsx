import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components';

const Text = styled.div<{ loggedIn: boolean }>`
  margin-right: ${({ theme }) => theme.spacingPx * 4}px;
  color: ${({ loggedIn, theme }) =>
    loggedIn ? theme.colors.white3 : theme.colors.error};
`;

interface ICPLoginStatusTextProps {
  email?: string;
}

const CPLoginStatusText: React.FC<ICPLoginStatusTextProps> = ({ email }) => {
  const isLoggedIn = typeof email !== 'undefined';

  return (
    <Text loggedIn={isLoggedIn}>
      {isLoggedIn ? (
        <Fragment key='login-state'>
          You are logged in as <code>{email}</code>
        </Fragment>
      ) : (
        <Fragment key='login-state'>You are not logged in.</Fragment>
      )}
    </Text>
  );
};

CPLoginStatusText.propTypes = {
  email: PropTypes.string,
};

export default CPLoginStatusText;
