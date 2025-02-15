import React, { ComponentPropsWithoutRef, FC, useState } from 'react';
import styled from 'styled-components';
import LabelWrapper from 'UI/Display/Cluster/ClusterLabels/LabelWrapper';

import EditLabelTooltip from './EditLabelTooltip';

const ClusterLabelsWrapper = styled.div<{ showTitle?: boolean }>`
  display: grid;
  grid-template: ${({ showTitle }) =>
    showTitle ? '"title labels" ". bottom"' : '"labels" "bottom"'};
  grid-template-columns: ${({ showTitle }) =>
    showTitle ? '203px 1fr' : 'auto'};
`;

const LabelsWrapper = styled.div`
  grid-area: labels;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

const LabelsTitle = styled.span`
  grid-area: title;
  margin: 5px;
`;

const BottomAreaText = styled.span`
  grid-area: bottom;
  font-size: 13px;
`;

const ErrorText = styled(BottomAreaText)`
  color: ${({ theme }) => theme.colors.error};
  font-weight: 400;
`;

const NoLabels = styled.div`
  grid-area: labels;
  display: flex;
  align-items: center;
`;

const NoLabelsEditLabelTooltip = styled(EditLabelTooltip)`
  margin-left: ${({ theme }) => theme.global.edgeSize.medium};
`;

interface IClusterLabelsProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  onChange: (patch: ILabelChange) => void;
  labels?: Record<string, string>;
  isLoading?: boolean;
  errorMessage?: string;
  showTitle?: boolean;
  unauthorized?: boolean;
}

const ClusterLabels: FC<IClusterLabelsProps> = ({
  labels,
  onChange,
  isLoading,
  errorMessage,
  showTitle,
  unauthorized,
  ...props
}) => {
  const [allowEditing, setAllowEditing] = useState(true);

  const noLabels = !labels || Object.keys(labels).length === 0;

  return (
    <ClusterLabelsWrapper showTitle={showTitle} {...props}>
      {showTitle && <LabelsTitle>Labels:</LabelsTitle>}
      {noLabels ? (
        <NoLabels>
          This cluster has no labels.
          {!unauthorized && (
            <NoLabelsEditLabelTooltip
              allowInteraction={!isLoading && allowEditing}
              label=''
              onOpen={(isOpen) => setAllowEditing(isOpen)}
              onSave={onChange}
              value=''
            />
          )}
        </NoLabels>
      ) : (
        <>
          <LabelsWrapper>
            {labels &&
              Object.entries(labels).map(([label, value]) => (
                <LabelWrapper key={label}>
                  <EditLabelTooltip
                    allowInteraction={!isLoading && allowEditing}
                    label={label}
                    onOpen={(isOpen) => setAllowEditing(isOpen)}
                    onSave={onChange}
                    value={value}
                    unauthorized={unauthorized}
                  />
                </LabelWrapper>
              ))}
            {!unauthorized && (
              <EditLabelTooltip
                allowInteraction={!isLoading && allowEditing}
                label=''
                onOpen={(isOpen) => setAllowEditing(isOpen)}
                onSave={onChange}
                value=''
              />
            )}
          </LabelsWrapper>
          {errorMessage && (
            <ErrorText>Could not save labels. Please try again.</ErrorText>
          )}
        </>
      )}
    </ClusterLabelsWrapper>
  );
};

ClusterLabels.defaultProps = {
  showTitle: true,
};

export default ClusterLabels;
