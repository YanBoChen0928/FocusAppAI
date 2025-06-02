import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Popover,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import apiService from '../../services/api';
import { useReportStore } from '../../store/reportStore';
import '../../styles/AIFeedback.css';

export default function AIFeedback({ goalId }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Add time range selection state
  const [timeRange, setTimeRange] = useState('last7days');
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  // Popover state
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [currentPopoverContent, setCurrentPopoverContent] = useState('');
  const [currentPopoverTitle, setCurrentPopoverTitle] = useState('');
  
  // Handle popover open
  const handlePopoverOpen = (event, title, content) => {
    setPopoverAnchorEl(event.currentTarget);
    setCurrentPopoverTitle(title);
    setCurrentPopoverContent(content);
  };
  
  // Handle popover close
  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
  };
  
  const isPopoverOpen = Boolean(popoverAnchorEl);
  const popoverId = isPopoverOpen ? 'feedback-popover' : undefined;

  // Use Zustand store
  const { reports, setReport } = useReportStore();

  // Effect to load report from store when goalId changes
  useEffect(() => {
    if (goalId && reports[goalId]) {
      setFeedback(reports[goalId]);
      setLastUpdate(new Date(reports[goalId].generatedAt));
      if (reports[goalId].dateRange) {
        setStartDate(new Date(reports[goalId].dateRange.startDate));
        setEndDate(new Date(reports[goalId].dateRange.endDate));
      }
    } else {
      // Reset when no report exists for this goal
      setFeedback(null);
      setLastUpdate(null);
    }
  }, [goalId, reports]);

  // Handle time range change
  const handleTimeRangeChange = (event) => {
    const value = event.target.value;
    setTimeRange(value);
    
    if (value === 'last7days') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      setStartDate(start);
      setEndDate(end);
    } else if (value === 'last30days') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      setStartDate(start);
      setEndDate(end);
    } else if (value === 'custom') {
      setCustomDateOpen(true);
    }
  };

  // Close custom date dialog
  const handleCloseCustomDate = () => {
    setCustomDateOpen(false);
    // If the user cancels without selecting dates, revert to last selection
    setTimeRange(timeRange === 'custom' ? 'last7days' : timeRange);
  };

  // Confirm custom date range
  const handleConfirmCustomDate = () => {
    setCustomDateOpen(false);
    setTimeRange('custom');
  };

  const generateFeedback = async () => {
    // If no goalId, return directly
    if (!goalId) {
      setError('No goal selected, cannot generate analysis');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Starting to request report generation, goalId:', goalId);
      console.log('Time range:', timeRange, 'Start date:', startDate, 'End date:', endDate);
      
      // Convert dates to ISO string format
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      const response = await apiService.reports.generate(goalId, startDateStr, endDateStr);
      console.log('Received report response:', response);
      
      if (response.data && response.data.success) {
        console.log('Report data:', response.data.data);
        const reportData = {
          ...response.data.data,
          startDate: startDateStr,
          endDate: endDateStr
        };
        
        setFeedback(reportData);
        setLastUpdate(new Date());
        
        // Save to Zustand store
        setReport(goalId, reportData);
      } else {
        console.log('Failed to generate report, response:', response);
        setError('Failed to generate analysis, please try again later');
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      
      // 针对超时错误给出更友好的提示
      if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
        setError('AI分析服务响应超时，请再次点击生成按钮重试。由于AI分析需要一定时间，这是正常情况。');
      } else {
        setError(err.response?.data?.error || 'Failed to generate analysis, please try again later');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to Apple style
  const formatTimestampAppleStyle = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    const options = {
      month: 'short', // e.g., Apr
      day: 'numeric', // e.g., 13
      year: 'numeric', // e.g., 2025
      hour: 'numeric', // e.g., 10
      minute: '2-digit', // e.g., 55
      hour12: true // e.g., AM/PM
    };
    
    return date.toLocaleString('en-US', options);
  };

  return (
    <Paper 
      elevation={0} /* Remove elevation for flatter Apple look */
      className="ai-feedback-paper"
      sx={{ 
        borderRadius: '12px', /* Slightly smaller radius */
        overflow: 'hidden',
        boxShadow: 'none', /* Remove default shadow */
        border: '1px solid #e5e5e5', /* Subtle border like Apple cards */
        mb: 2,
        backgroundColor: '#fdfdfd' /* Off-white background */
      }}
    >
      <Box 
        className="ai-feedback-header"
        sx={{
          px: 2,
          pt: 2,
          pb: 0, /* Remove bottom padding here */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' /* Center items */
        }}
      >
        {/* Line 1: Title */}
        <Typography 
          variant="subtitle1" 
          className="ai-feedback-title"
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            mb: 1, /* Reduced margin bottom */
            textAlign: 'center',
            color: '#333'
          }}
        >
          AI Progress Analysis
        </Typography>
        
        {/* Line 2: Date Range Selector */}
        <FormControl 
          fullWidth 
          variant="outlined" 
          size="small" 
          sx={{ mb: 1, maxWidth: '250px' }} /* Add max-width */
        >
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
            sx={{
              borderRadius: '8px',
              backgroundColor: '#ffffff', /* White background for select */
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ddd'
              }
            }}
          >
            <MenuItem value="last7days">Last 7 Days</MenuItem>
            <MenuItem value="last30days">Last 30 Days</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>
        
        {/* Line 3: Generate Button */}
        <Button 
          variant="contained" 
          onClick={generateFeedback}
          disabled={loading || !goalId}
          className="ai-feedback-generate-btn"
          sx={{
            borderRadius: '8px', /* Slightly smaller radius */
            padding: '6px 16px', /* Adjust padding */
            minWidth: 'auto', /* Allow natural width */
            bgcolor: '#0D5E6D', /* Use accent color */
            textTransform: 'none', /* No uppercase */
            fontWeight: 500,
            mb: 1, /* Keep margin bottom */
            boxShadow: 'none', /* Remove shadow */
            '&:hover': {
              bgcolor: '#0A4A57' /* Slightly darker hover for the new color */
            }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
              Analyzing...
            </>
          ) : 'Generate' /* Changed from Regenerate */}
        </Button>
      </Box>

      {/* Custom date range dialog */}
      <Dialog open={customDateOpen} onClose={handleCloseCustomDate}>
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box className="ai-feedback-date-picker-container">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    margin: "normal"
                  } 
                }}
                maxDate={endDate}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    margin: "normal"
                  } 
                }}
                minDate={startDate}
                maxDate={new Date()}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCustomDate}>Cancel</Button>
          <Button onClick={handleConfirmCustomDate} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Popover for section content - Styling adjusted for Apple-like look */}
      <Popover
        id={popoverId}
        open={isPopoverOpen}
        anchorEl={popoverAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          elevation: 0, /* Flat look */
          sx: {
            width: '90vw',
            maxWidth: '380px', /* Slightly wider */
            maxHeight: '60vh',
            borderRadius: '14px', /* More pronounced radius */
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)', /* Softer, larger shadow */
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden',
            mt: '8px' /* Space from anchor */
          }
        }}
      >
        <Card sx={{ boxShadow: 'none', backgroundColor: '#fff' }}>
          <CardHeader
            title={currentPopoverTitle}
            action={
              <IconButton aria-label="close" onClick={handlePopoverClose} size="small" sx={{ color: '#888' }}>
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            titleTypographyProps={{
              variant: 'subtitle2',
              sx: { fontWeight: 600, color: '#1d1d1f' } /* Darker text */
            }}
            sx={{ 
              py: 1, /* Adjust padding */
              px: 2,
              backgroundColor: '#f8f8f8', /* Lighter header bg */
              borderBottom: '1px solid #eee',
              '& .MuiCardHeader-action': { mr: -0.5, mt: -0.5 }
            }}
          />
          <CardContent sx={{ pt: 1.5, pb: 2, px: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                color: '#333',
                fontSize: '0.85rem' /* Slightly smaller text */
              }}
            >
              {currentPopoverContent}
            </Typography>
          </CardContent>
        </Card>
      </Popover>

      {/* AI Feedback Sections Container */} 
      <Box sx={{ px: 0, pt: 1, pb: 2, mt: '5px' /* Move sections up */ }}>
        {loading && (
          <Box className="ai-feedback-loading-container">
            <CircularProgress />
            <Typography variant="body2" className="ai-feedback-loading-text">
              Generating analysis...
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Box className="ai-feedback-error" sx={{ borderRadius: '10px' }}>
            {typeof error === 'string' ? error : error.message || 'An unknown error occurred'}
          </Box>
        )}

        {!loading && !error && !feedback && (
          <Box className="ai-feedback-placeholder">
            {goalId ? 'Click the button to generate AI analysis report' : 'Please select a goal first'}
          </Box>
        )}

        {feedback && !loading && !error && (
          <Box className="ai-feedback-result">
            {feedback.content && feedback.content.sections && feedback.content.sections.length > 0 ? (
              <Box className="ai-feedback-structured-content" sx={{ mt: 0.5 }}>
                {feedback.content.sections
                  .filter(section => section.title !== "---" && section.title.trim() !== "")
                  .map((section, index) => {
                    const title = section.title.replace(/^\*\*|\*\*$/g, '').trim();
                    let content = section.content;
                    if (title.toLowerCase().includes('actionable')) {
                      let count = 1;
                      content = content.replace(/- /g, () => `${count++}. `);
                    }
                    
                    // Render button to trigger Popover
                    return (
                      <Box 
                        key={index}
                        sx={{
                          mb: 0.8, /* Reduced margin between buttons */
                          width: '100%'
                        }}
                      >
                        <Button
                          variant="text" /* Flat button */
                          fullWidth
                          onClick={(e) => handlePopoverOpen(e, title, content)}
                          endIcon={<KeyboardArrowDownIcon sx={{ color: '#bbb' }}/>}
                          sx={{
                            justifyContent: 'space-between', /* Push icon to right */
                            textAlign: 'left',
                            padding: '10px 8px', /* Adjust padding */
                            borderRadius: '8px', /* Apple-like radius */
                            color: '#333', /* Standard text color */
                            backgroundColor: '#ffffff', /* White background */
                            border: '1px solid #e5e5e5', /* Subtle border */
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)', /* Very subtle shadow */
                            '&:hover': {
                              backgroundColor: '#f9f9f9', /* Slight hover bg */
                              borderColor: '#ddd'
                            },
                            fontWeight: 400, /* Regular weight */
                            fontSize: '0.875rem', /* Standard body font size */
                            textTransform: 'none'
                          }}
                        >
                          {title} {/* Removed bullet point */}
                        </Button>
                      </Box>
                    );
                  })}
              </Box>
            ) : (
              <Box className="ai-feedback-content" data-export-id="ai-analysis-content">
                {feedback.content && typeof feedback.content === 'object' 
                  ? feedback.content.details || 'No analysis content available'
                  : feedback.content || 'No analysis content available'}
              </Box>
            )}
            
            {/* Analysis Timestamp */}
            <Box className="ai-feedback-timestamp" sx={{ textAlign: 'right', mt: 0 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#888',
                  fontSize: '0.65rem' /* Slightly larger caption */
                }}
              >
                Analysis time: {lastUpdate ? formatTimestampAppleStyle(lastUpdate) : 'N/A'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
