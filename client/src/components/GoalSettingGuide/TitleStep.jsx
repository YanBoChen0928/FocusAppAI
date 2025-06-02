import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

/**
 * Goal Title Setting Step
 * Step 1: User inputs the title of the goal they want to achieve
 */
const TitleStep = ({ value, onChange }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        The goal I want to achieve/complete is <Box component="span" sx={{ color: 'error.main' }}>*</Box>
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Set a clear and specific goal. A well-defined goal makes it easier to track progress and ultimately succeed.
      </Typography>
      
      <TextField
        fullWidth
        required
        label="Goal Title"
        variant="outlined"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="For example: Meditate 15 minutes daily, Complete web development course..."
        inputProps={{ maxLength: 100 }}
        helperText={`${value.length}/100 characters`}
      />
    </Box>
  );
};

export default TitleStep; 