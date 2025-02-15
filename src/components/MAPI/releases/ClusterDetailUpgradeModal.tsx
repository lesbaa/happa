import { Box } from 'grommet';
import * as releasev1alpha1 from 'model/services/mapi/releasev1alpha1';
import React, { useMemo, useState } from 'react';
import Button from 'UI/Controls/Button';
import ClusterDetailUpgradeModalChangelog from 'UI/Display/MAPI/releases/ClusterDetailUpgradeModalChangelog';
import ClusterDetailUpgradeModalDisclaimer from 'UI/Display/MAPI/releases/ClusterDetailUpgradeModalDisclaimer';
import Modal from 'UI/Layout/Modal';

import { getReleaseComponentsDiff } from './utils';

enum ClusterDetailUpgradeModalPane {
  Disclaimer,
  Changelog,
}

function formatReleaseVersion(release: releasev1alpha1.IRelease) {
  // Remove leading `v`.
  return release.metadata.name.slice(1);
}

function formatModalTitle(
  pane: ClusterDetailUpgradeModalPane,
  fromRelease: releasev1alpha1.IRelease,
  toRelease: releasev1alpha1.IRelease
) {
  switch (pane) {
    case ClusterDetailUpgradeModalPane.Disclaimer:
      return `Upgrade to ${formatReleaseVersion(toRelease)}`;
    case ClusterDetailUpgradeModalPane.Changelog:
      return `Changes from ${formatReleaseVersion(
        fromRelease
      )} to ${formatReleaseVersion(toRelease)}`;
    default:
      return '';
  }
}

function formatPrimaryButtonText(pane: ClusterDetailUpgradeModalPane) {
  switch (pane) {
    case ClusterDetailUpgradeModalPane.Disclaimer:
      return 'Inspect changes';
    case ClusterDetailUpgradeModalPane.Changelog:
      return 'Start upgrade';
    default:
      return '';
  }
}

function formatVisiblePane(
  pane: ClusterDetailUpgradeModalPane,
  fromRelease: releasev1alpha1.IRelease,
  toRelease: releasev1alpha1.IRelease
) {
  switch (pane) {
    case ClusterDetailUpgradeModalPane.Disclaimer:
      return <ClusterDetailUpgradeModalDisclaimer />;

    case ClusterDetailUpgradeModalPane.Changelog:
      return (
        <ClusterDetailUpgradeModalChangelog
          releaseNotesURL={releasev1alpha1.getReleaseNotesURL(toRelease)}
          componentsDiff={getReleaseComponentsDiff(fromRelease, toRelease)}
        />
      );

    default:
      return null;
  }
}

interface IClusterDetailUpgradeModalProps {
  fromRelease: releasev1alpha1.IRelease;
  toRelease: releasev1alpha1.IRelease;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
  visible?: boolean;
}

const ClusterDetailUpgradeModal: React.FC<IClusterDetailUpgradeModalProps> = ({
  fromRelease,
  toRelease,
  onUpgrade,
  visible,
  onClose,
}) => {
  const [currentPane, setCurrentPane] = useState(
    ClusterDetailUpgradeModalPane.Disclaimer
  );

  const title = useMemo(
    () => formatModalTitle(currentPane, fromRelease, toRelease),
    [currentPane, fromRelease, toRelease]
  );
  const primaryButtonText = formatPrimaryButtonText(currentPane);
  const visiblePane = useMemo(
    () => formatVisiblePane(currentPane, fromRelease, toRelease),
    [currentPane, fromRelease, toRelease]
  );

  const handlePrimaryButtonClick = () => {
    switch (currentPane) {
      case ClusterDetailUpgradeModalPane.Disclaimer:
        setCurrentPane(currentPane + 1);
        break;
      case ClusterDetailUpgradeModalPane.Changelog:
        onUpgrade();
        break;
    }
  };

  return (
    <Modal
      footer={
        <Box direction='row' gap='small' justify='end'>
          {primaryButtonText && (
            <Button primary={true} onClick={handlePrimaryButtonClick}>
              {primaryButtonText}
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
        </Box>
      }
      onClose={onClose}
      title={title}
      aria-label={title}
      visible={visible}
    >
      {visiblePane}
    </Modal>
  );
};

export default ClusterDetailUpgradeModal;
