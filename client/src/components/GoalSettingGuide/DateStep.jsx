import React from 'react';
import { Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS } from 'date-fns/locale';

/**
 * Date Setting Step
 * User sets the target completion date for the goal
 */
const DateStep = ({ value, onChange }) => {
  // Handle date change
  const handleDateChange = (date) => {
    onChange(date);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        I plan to achieve this goal by <Box component="span" sx={{ color: 'error.main' }}>*</Box>
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Set a clear deadline for your goal, which creates a sense of urgency and helps you plan better.
      </Typography>
      
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
        <DatePicker
          label="Target Date"
          value={value}
          onChange={handleDateChange}
          disablePast
          slotProps={{ 
            textField: { 
              fullWidth: true,
              required: true,
              variant: "outlined",
              helperText: "Select a target completion date"
            } 
          }}
        />
      </LocalizationProvider>
    </Box>
  );
};

export default DateStep; 