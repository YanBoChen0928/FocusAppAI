import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

/**
 * Motivation Exploration Step
 * Step 2: User explores and expresses why they want to achieve this goal
 */
const MotivationStep = ({ value, onChange }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        I want to achieve this goal mainly because <Box component="span" sx={{ color: 'error.main' }}>*</Box>
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Think deeply about your motivation and understand "why" you want to achieve this goal. A strong intrinsic motivation is key to perseverance.
      </Typography>
      
      <TextField
        fullWidth
        required
        multiline
        rows={4}
        label="Motivation"
        variant="outlined"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="For example: This goal is important to me because..."
        inputProps={{ maxLength: 500 }}
        helperText={`${value.length}/500 characters`}
      />
    </Box>
  );
};

export default MotivationStep; 