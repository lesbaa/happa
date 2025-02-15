import { Box, Heading, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

const StyledLink = styled.a`
  color: ${({ theme }) => theme.global.colors['input-highlight']};
  display: inline-block;
  width: auto;
`;

interface ICLIGuideAdditionalInfoLink {
  label: string;
  href: string;
  external?: boolean;
}

interface ICLIGuideAdditionalInfoProps
  extends React.ComponentPropsWithoutRef<'div'> {
  links?: ICLIGuideAdditionalInfoLink[];
}

const CLIGuideAdditionalInfo: React.FC<ICLIGuideAdditionalInfoProps> = ({
  links,
  ...props
}) => {
  return (
    <Box {...props}>
      <Box>
        <Heading level={5}>Additional information</Heading>
      </Box>
      <Box direction='column' gap='xxsmall'>
        {links?.map((link) => (
          <div key={`${link.label}-${link.href}`}>
            <StyledLink
              href={link.href}
              rel={link.external ? 'noopener noreferrer' : undefined}
              target={link.external ? '_blank' : undefined}
            >
              {link.external && (
                <Text
                  className='fa fa-open-in-new'
                  aria-hidden={true}
                  role='presentation'
                  aria-label='Opens in a new tab'
                  margin={{ right: 'xsmall' }}
                />
              )}
              {link.label}
            </StyledLink>
          </div>
        ))}
      </Box>
    </Box>
  );
};

export default CLIGuideAdditionalInfo;
