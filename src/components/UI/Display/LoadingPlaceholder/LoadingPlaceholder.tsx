import { Box } from 'grommet';
import * as React from 'react';
import ContentLoader from 'react-content-loader';
import { useTheme } from 'styled-components';

interface ILoadingPlaceholderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Box>, 'height' | 'width'> {
  height?: number;
  width?: number;
}

const LoadingPlaceholder: React.FC<ILoadingPlaceholderProps> = ({
  height,
  width,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Box
      width={{ max: `${width}px` }}
      overflow='hidden'
      round='xsmall'
      {...props}
    >
      <ContentLoader
        viewBox={`0 0 ${width} ${height}`}
        speed={2}
        height={height}
        width={width}
        backgroundColor={theme.global.colors['text-xweak'].dark}
        foregroundColor={theme.global.colors['text-weak'].dark}
      >
        <rect x='0' y='0' rx='0' ry='0' width={width} height={height} />
      </ContentLoader>
    </Box>
  );
};

LoadingPlaceholder.defaultProps = {
  height: 15,
  width: 100,
};

export default React.memo(LoadingPlaceholder);
