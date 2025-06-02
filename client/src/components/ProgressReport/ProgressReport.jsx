import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import ExportButton from './ExportButton';
import AIFeedback from './AIFeedback';
import styles from './ProgressReport.module.css';

export default function ProgressReport({ goalId, sx = {} }) {
  // If no goalId, show prompt message
  if (!goalId) {
    return (
      <Box className={styles.reportContainer} sx={{ ...sx }}>
        <div className={styles.noGoalMessage}>Please select a goal first</div>
      </Box>
    );
  }

  return (
    <Box className={styles.reportContainer} sx={{ ...sx }}>
      <ExportButton goalId={goalId} />
      <AIFeedback goalId={goalId} />
    </Box>
  );
}

ProgressReport.propTypes = {
  goalId: PropTypes.string,
  sx: PropTypes.object
};
