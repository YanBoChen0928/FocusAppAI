import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import Looks3Icon from '@mui/icons-material/Looks3';
import ExportButton from './ExportButton';
import AIFeedback from './AIFeedback';
import styles from './ProgressReport.module.css';

export default function ProgressReport({ goalId, sx = {} }) {
  // If no goalId, show prompt message
  if (!goalId) {
    return (
      <Box className={styles.reportContainer} sx={{ ...sx }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Looks3Icon sx={{ mr: 1, fontSize: '1.2rem', color: '#0D5E6D' }} />
          Progress Report
        </Typography>
        <div className={styles.noGoalMessage}>Please select a goal first</div>
      </Box>
    );
  }

  return (
    <Box className={styles.reportContainer} sx={{ ...sx }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Looks3Icon sx={{ mr: 1, fontSize: '1.2rem', color: '#0D5E6D' }} />
        Progress Report
      </Typography>
      <ExportButton goalId={goalId} />
      <AIFeedback goalId={goalId} />
    </Box>
  );
}

ProgressReport.propTypes = {
  goalId: PropTypes.string,
  sx: PropTypes.object
};
