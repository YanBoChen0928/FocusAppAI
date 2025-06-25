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
import {
  DndContext,
  useDraggable,
  useDroppable,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import { startOfDay, endOfDay } from 'date-fns';

// Last modified: 2025-06-21
// Changes: Added paragraph spacing using MUI styling system

// DroppableArea component for handling the droppable region
function DroppableArea({ children }) {
  const { setNodeRef } = useDroppable({
    id: 'droppable-area',
    data: {
      accepts: ['feedback-popover']
    }
  });

  return (
    <div ref={setNodeRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {children}
    </div>
  );
}

// Draggable wrapper component that maintains original positioning behavior
function DraggablePopover({ children, isDragging, setIsDragging, dragPosition, setDragPosition }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'feedback-popover',
    data: {
      type: 'popover'
    }
  });

  const style = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: isDragging && transform ? 
      `translate(-50%, -50%) translate(${dragPosition.x + transform.x}px, ${dragPosition.y + transform.y}px)` :
      `translate(-50%, -50%) translate(${dragPosition.x}px, ${dragPosition.y}px)`,
    zIndex: 1300,
    touchAction: 'none',
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return children?.({
    ref: setNodeRef,
    style,
    dragAttributes: attributes ?? {},
    dragListeners: listeners ?? {},
    isDragging
  });
}

export default function AIFeedback({ goalId }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Add drag states at component level
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  // Add sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    })
  );

  // Add time range selection state
  const [timeRange, setTimeRange] = useState('last7days');
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null,
    displayStart: null,
    displayEnd: null
  });
  const { start: initialStart, end: initialEnd } = getLastNDaysRange(7);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
    setDragPosition({ x: 0, y: 0 }); // Reset position when closing
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
      setCustomDateRange({
        start: null,
        end: null,
        displayStart: null,
        displayEnd: null
      });
    } else if (value === 'last30days') {
      const { start, end } = getLastNDaysRange(30);
      setStartDate(start);
      setEndDate(end);
      setCustomDateRange({
        start: null,
        end: null,
        displayStart: null,
        displayEnd: null
      });
    } else if (value === 'custom') {
      // Always open date picker dialog when custom is selected
      setCustomDateOpen(true);
    }
  };

  // Close custom date dialog
  const handleCloseCustomDate = () => {
    setCustomDateOpen(false);
    if (!customDateRange.start && !customDateRange.end) {
      // If no custom range was set, revert to previous selection
      setTimeRange(timeRange === 'custom' ? 'last7days' : timeRange);
    }
  };

  // Confirm custom date range
  const handleConfirmCustomDate = () => {
    if (isValidDateRange(startDate, endDate)) {
      const start = startOfDay(startDate);
      const end = endOfDay(endDate);
      
      console.log('Date range calculated:', {
        start: start.toLocaleString(),
        end: end.toLocaleString(),
        startUTC: start.toISOString(),
        endUTC: end.toISOString()
      });
      
      setCustomDateRange({
        startDate: start.toISOString(),  // UTC for server
        endDate: end.toISOString(),      // UTC for server
        displayStart: start,             // Local for display
        displayEnd: end                  // Local for display
      });
      
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
    
      // Get date range using the utility function with custom range
      const dateRange = getDateRangeForAnalysis(timeRange, customDateRange);
      
      console.log('Date range calculated:', {
        start: formatDisplayDate(dateRange.displayStart),
        end: formatDisplayDate(dateRange.displayEnd),
        startUTC: dateRange.startDate,
        endUTC: dateRange.endDate,
        timeZone: userTimeZone
      });

      // Send request with correct date range format
      const response = await apiService.reports.generate(
        goalId, 
        dateRange.startDate, 
        dateRange.endDate,
        userTimeZone
      );
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
    // Handle custom range with incomplete date selection
    if (timeRange === 'custom' && (!customDateRange.start || !customDateRange.end)) {
      return 'Please select custom date range';
    }
    
    // Handle custom range with complete date selection
    if (timeRange === 'custom' && customDateRange.start && customDateRange.end) {
      const dateRange = getDateRangeForAnalysis('custom', {
        startDate: customDateRange.start,
        endDate: customDateRange.end
      });
      return getDateRangeString(dateRange.displayStart, dateRange.displayEnd);
    }
    
    // Handle preset ranges (7 days or 30 days)
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
    <DndContext
      sensors={sensors}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event) => {
        setIsDragging(false);
        if (event.delta) {
          setDragPosition(prev => ({
            x: prev.x + event.delta.x,
            y: prev.y + event.delta.y
          }));
        }
      }}
    >
      <DroppableArea>
        <Paper 
          elevation={2}
          className="ai-feedback-paper"
          sx={{ 
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'none',
            border: '1px solid #e5e5e5',
            mb: 2,
            backgroundColor: '#fdfdfd'
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
              sx={{ mb: 1, maxWidth: customDateRange.displayStart && customDateRange.displayEnd ? 'auto' : '250px' }}
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
                  backgroundColor: '#ffffff',
                  minWidth: '200px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ddd'
                  }
                }}
              >
                <MenuItem value="last7days">Last 7 Days</MenuItem>
                <MenuItem value="last30days">Last 30 Days</MenuItem>
                <MenuItem 
                  value="custom"
                  onClick={() => {
                    // Directly open date picker when clicking this MenuItem
                    setCustomDateOpen(true);
                  }}
                >
                  {(timeRange === 'custom' && customDateRange.displayStart && customDateRange.displayEnd) 
                    ? `${formatDisplayDate(customDateRange.displayStart)} - ${formatDisplayDate(customDateRange.displayEnd)}`
                    : 'Custom Range'}
                </MenuItem>
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
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  mt: 2
                }}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    format="MM/dd/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: `Timezone: ${userTimeZone}`
                      }
                    }}
                    maxDate={endDate}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    format="MM/dd/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: `Timezone: ${userTimeZone}`
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
              <Button 
                onClick={handleConfirmCustomDate} 
                variant="contained"
                disabled={!isValidDateRange(startDate, endDate)}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

          {/* Popover wrapped with DraggablePopover */}
          {isPopoverOpen && (
            <DraggablePopover
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              dragPosition={dragPosition}
              setDragPosition={setDragPosition}
            >
              {({ ref, style, dragAttributes, dragListeners, isDragging }) => (
                <Popover
                  ref={ref}
                  style={style}
                  id={popoverId}
                  open={isPopoverOpen}
                  anchorEl={popoverAnchorEl}
                  onClose={() => {}}
                  disablePortal={false}
                  disableEnforceFocus
                  disableRestoreFocus
                  disableScrollLock={true}
                  keepMounted
                  modality="none"
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                  }}
                  BackdropProps={{
                    style: { pointerEvents: 'none' }
                  }}
                  sx={{
                    pointerEvents: 'auto',
                    '& .MuiPopover-paper': {
                      pointerEvents: 'auto',
                      position: 'static',
                      width: {
                        xs: '90vw',
                        sm: '90vw',
                        md: '380px',
                        lg: '60vw'
                      },
                      minHeight: '200px',
                      maxHeight: '80vh',
                      height: 'auto',
                      transform: 'none !important',
                      display: 'flex',
                      flexDirection: 'column'
                    },
                    '& .MuiBackdrop-root': {
                      backgroundColor: 'transparent'
                    }
                  }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      borderRadius: '14px',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      overflow: 'hidden'
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
                      title={
                        <div 
                          {...dragAttributes} 
                          {...dragListeners}
                          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        >
                          {currentPopoverTitle}
                        </div>
                      }
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
                      sx={{ 
                        py: 1,
                        px: 2,
                        backgroundColor: '#f8f8f8',
                        borderBottom: '1px solid #eee',
                        '& .MuiCardHeader-action': { mr: -0.5, mt: -0.5 },
                        width: '100%',
                        '&:active': {
                          cursor: 'grabbing'
                        }
                      }}
                    />
                    <CardContent sx={{
                      pt: 1.5,
                      pb: 2,
                      px: 2,
                      width: '100%',
                      height: '100%',
                      overflow: 'auto'
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
              )}
            </DraggablePopover>
          )}

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
      </DroppableArea>
    </DndContext>
  );
}
