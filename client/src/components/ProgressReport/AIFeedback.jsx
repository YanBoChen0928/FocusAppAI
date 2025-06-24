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
import {
  getLastNDaysRange,
  getCustomDateRange,
  formatDisplayDate,
  formatISOWithTimezone,
  parseISOToLocal,
  isValidDateRange,
  getDateRangeForAnalysis,
  getDateRangeString
} from '../../utils/dateUtils';
import '../../styles/AIFeedback.css';

// Last modified: 2025-06-21
// Changes: Added paragraph spacing using MUI styling system

export default function AIFeedback({ goalId }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Add time range selection state
  const [timeRange, setTimeRange] = useState('last7days');
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const { start: initialStart, end: initialEnd } = getLastNDaysRange(7);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  // Popover state
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [currentPopoverContent, setCurrentPopoverContent] = useState('');
  const [currentPopoverTitle, setCurrentPopoverTitle] = useState('');
  
  // Handle popover open
  const handlePopoverOpen = (event, title, content) => {
    // Find the vision-section element
    const visionSection = document.querySelector('.vision-section.MuiBox-root');
    if (visionSection && window.innerWidth >= 1101) {
      setPopoverAnchorEl(visionSection);
    } else {
      setPopoverAnchorEl(event.currentTarget);
    }
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
      setLastUpdate(parseISOToLocal(reports[goalId].generatedAt));
      if (reports[goalId].dateRange) {
        setStartDate(parseISOToLocal(reports[goalId].dateRange.startDate));
        setEndDate(parseISOToLocal(reports[goalId].dateRange.endDate));
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
      const { start, end } = getLastNDaysRange(7);
      setStartDate(start);
      setEndDate(end);
    } else if (value === 'last30days') {
      const { start, end } = getLastNDaysRange(30);
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
    if (isValidDateRange(startDate, endDate)) {
      setCustomDateOpen(false);
      setTimeRange('custom');
    }
  };

  const generateFeedback = async () => {
    if (!goalId) {
      setError('No goal selected, cannot generate analysis');
      return;
    }

    setLoading(true);
    setError(null);
    try {
          console.log('Starting to request report generation, goalId:', goalId);
    
    // Get date range using the utility function
    const dateRange = getDateRangeForAnalysis(timeRange);
    
    console.log('Date range calculated:', {
      start: formatDisplayDate(dateRange.displayStart),
      end: formatDisplayDate(dateRange.displayEnd),
      startUTC: dateRange.startDate,
      endUTC: dateRange.endDate
    });

    // Send request with correct date range format
    const response = await apiService.reports.generate(goalId, dateRange.startDate, dateRange.endDate);
      console.log('Received report response:', response);
      
      if (response.data && response.data.success) {
        console.log('Report data:', response.data.data);
        const reportData = {
          ...response.data.data,
          dateRange: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            displayStart: dateRange.displayStart,
            displayEnd: dateRange.displayEnd
          }
        };
        
        setFeedback(reportData);
        // Ensure we have a valid date for lastUpdate with timezone
        const generatedAt = new Date().toISOString();
        console.log('Setting lastUpdate with generatedAt:', generatedAt);
        setLastUpdate(new Date(generatedAt));
        
        // Save to Zustand store with complete date information
        setReport(goalId, {
          ...reportData,
          generatedAt,
          dateRange: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            displayStart: dateRange.displayStart,
            displayEnd: dateRange.displayEnd
          }
        });
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
      
      if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
        setError('AI analysis service response timeout, please click the generate button again to try. This is normal because AI analysis takes some time.');
      } else {
        setError(err.response?.data?.error || 'Failed to generate analysis, please try again later');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to Apple style
  const formatTimestampAppleStyle = (timestamp) => {
    if (!timestamp) {
      console.warn('No timestamp provided to formatTimestampAppleStyle');
      return 'N/A';
    }
    try {
      const date = parseISOToLocal(timestamp);
      if (!date) {
        console.warn('parseISOToLocal returned null for timestamp:', timestamp);
        return 'Invalid Date';
      }
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'shortOffset'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Timestamp:', timestamp);
      return 'Error';
    }
  };

  // Date range display
  const renderDateRange = () => {
    if (timeRange === 'custom' && customDateRange) {
      return getDateRangeString(customDateRange.startDate, customDateRange.endDate);
    }

    const dateRange = getDateRangeForAnalysis(timeRange);
    return getDateRangeString(dateRange.displayStart, dateRange.displayEnd);
  };

  // Add formatContent helper function after the existing functions
  const formatSectionContent = (content) => {
    if (!content) return content;
    
    // First clean up any markdown ** syntax from the entire content
    content = content.replace(/\*\*/g, '');
    
    const lines = content.split('\n');
    let formattedLines = [];
    let subCount = 1;     // For numbered items within sections
    let isInActionableSection = false;
    let currentSubsection = '';  // Track current subsection (A, B, C)
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (!line) {
        formattedLines.push('');
        continue;
      }
      
      // Check if we're in Actionable Suggestions section
      if (line.startsWith('3. Actionable Suggestions')) {
        isInActionableSection = true;
        formattedLines.push(line);
        continue;
      }
      
      if (isInActionableSection) {
        // Handle subsection headers (Next Steps, Improvements, Motivation)
        if (line.match(/^[A-C]\.\s/)) {
          currentSubsection = line;
          if (formattedLines.length > 0) formattedLines.push('');  // Add space before new subsection
          formattedLines.push(`<span class="section-title">${line}</span>`);
          subCount = 1;  // Reset counter for new subsection
          continue;
        }
        
        // Handle numbered items or bullet points in Actionable section
        if (line.startsWith('- ') || /^\d+\./.test(line)) {
          // Remove existing numbering/bullet
          let cleanLine = line.replace(/^-\s+|^\d+\.\s+/, '');
          
          // Split into title and explanation if there's a colon
          const [title, ...rest] = cleanLine.split(':');
          
          // Add space before new item (except first item)
          if (subCount > 1) {
            formattedLines.push('');
          }
          
          // Format with proper numbering
          formattedLines.push(
            `${subCount}. <span class="bold-title">${title.trim()}</span>${rest.length ? ': ' + rest.join(':').trim() : ''}`
          );
          subCount++;
        } else {
          // Regular text lines in Actionable section
          formattedLines.push(line);
        }
      } else {
        // Handle bullet points in other sections
        if (line.startsWith('- ')) {
          const [title, ...rest] = line.substring(2).split(':');
          formattedLines.push(
            `- <span class="bold-title">${title.trim()}</span>${rest.length ? ': ' + rest.join(':').trim() : ''}`
          );
        } else {
          formattedLines.push(line);
        }
      }
    }
    
    return formattedLines.join('\n');
  };

  return (
    <Paper 
      elevation={2} /* Changed from 8 to 2 */
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
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handlePopoverClose();
          }
        }}
        disableRestoreFocus
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: {
              xs: '90vw',
              sm: '90vw',
              md: '380px',
              lg: '60vw'
            },
            height: {
              xs: 'auto',
              sm: 'auto',
              md: 'auto',
              lg: 'auto'
            },
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: '14px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden',
            '@media (min-width: 1101px)': {
              width: '60vw',
              maxWidth: 'none',
              maxHeight: 'none',
              zIndex: 1300,
              position: 'fixed',
              top: '30vh',
              left: '50%',
              transform: 'translateX(-50%)',
              height: 'auto'
            }
          }
        }}
      >
        <Card sx={{ 
          boxShadow: 'none', 
          backgroundColor: '#fff',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          <CardHeader
            title={currentPopoverTitle}
            action={
              <IconButton 
                aria-label="close" 
                onClick={handlePopoverClose} 
                size="small" 
                sx={{ 
                  color: '#888',
                  padding: '8px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            titleTypographyProps={{
              variant: 'subtitle2',
              sx: { 
                fontWeight: 600, 
                color: '#1d1d1f',
                fontSize: '1.1rem'
              }
            }}
            sx={{ 
              py: 1,
              px: 2,
              backgroundColor: '#f8f8f8',
              borderBottom: '1px solid #eee',
              '& .MuiCardHeader-action': { mr: -0.5, mt: -0.5 },
              width: '100%'
            }}
          />
          <CardContent sx={{
            pt: 1.5,
            pb: 2,
            px: 2,
            width: '100%',
            height: '100%',
            overflow: 'auto',
            '@media (min-width: 1101px)': {
              width: '100%',
              boxSizing: 'border-box'
            }
          }}>
            <Typography
              variant="body2"
              component="div"
              sx={{
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                color: '#333',
                fontSize: '0.85rem',
                width: '100%',
                '& .bold-title': {
                  fontWeight: 600,
                  color: '#1d1d1f',
                  display: 'inline'
                },
                '& p': {
                  marginBottom: '1rem',
                  width: '100%'
                },
                '& > div': {
                  marginBottom: '1rem',
                  width: '100%'
                },
                '& > div + div': {
                  marginTop: '1rem'
                }
              }}
              dangerouslySetInnerHTML={{ __html: formatSectionContent(currentPopoverContent).split('\n').map(line => 
                line.trim() ? `<div>${line}</div>` : '<div>&nbsp;</div>'
              ).join('')}}
            />
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
                    // Remove the preprocessing of content
                    const content = section.content;
                    
                    return (
                      <Box 
                        key={index}
                        sx={{
                          mb: 0.8,
                          width: '100%'
                        }}
                      >
                        <Button
                          variant="text"
                          fullWidth
                          onClick={(e) => handlePopoverOpen(e, title, content)}
                          endIcon={<KeyboardArrowDownIcon sx={{ color: '#bbb' }}/>}
                          sx={{
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            padding: '10px 8px',
                            borderRadius: '8px',
                            color: '#333',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e5e5',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            '&:hover': {
                              backgroundColor: '#f9f9f9',
                              borderColor: '#ddd'
                            },
                            fontWeight: 400,
                            fontSize: '0.875rem',
                            textTransform: 'none'
                          }}
                        >
                          {title}
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

        {/* Date range display */}
        <Typography variant="body2" color="textSecondary">
          Time Range: {renderDateRange()}
        </Typography>
      </Box>
    </Paper>
  );
}
