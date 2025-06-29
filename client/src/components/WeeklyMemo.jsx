import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { DndContext, useDraggable, useSensor, PointerSensor } from '@dnd-kit/core';
import apiService from '../services/api';

const WeeklyMemo = ({ reportId, onClose, open }) => {
  // State management
  const [expandedSteps, setExpandedSteps] = useState(new Set([0]));
  const [memos, setMemos] = useState({
    originalMemo: { content: '', timestamp: null },
    aiDraft: { content: '', timestamp: null },
    finalMemo: { content: '', timestamp: null },
    nextWeekPlan: { content: '', timestamp: null }
  });
  const [editingPhase, setEditingPhase] = useState(null);
  const [tempContent, setTempContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Phase configuration
  const phases = [
    {
      key: 'originalMemo',
      label: 'Original Memo',
      description: 'Write your initial thoughts and reflections',
      icon: <EditIcon />,
      placeholder: 'Share your thoughts about this week\'s progress...'
    },
    {
      key: 'aiDraft',
      label: 'AI Draft',
      description: 'AI-generated draft based on your memo and progress analysis',
      icon: <AutoAwesomeIcon />,
      placeholder: 'AI will generate a comprehensive draft...'
    },
    {
      key: 'finalMemo',
      label: 'Final Memo',
      description: 'Edit and finalize your weekly memo',
      icon: <CheckCircleIcon />,
      placeholder: 'Refine your memo to create the final version...'
    },
    {
      key: 'nextWeekPlan',
      label: 'Next Week Planning',
      description: 'Plan your priorities for the upcoming week',
      icon: <ScheduleIcon />,
      placeholder: 'AI will generate a focused plan for next week...'
    }
  ];

  // Toggle step expansion
  const toggleStep = (index) => {
    console.log('[WeeklyMemo] Toggle step clicked:', { index, currentExpanded: Array.from(expandedSteps) });
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        console.log('[WeeklyMemo] Collapsing step:', index);
      } else {
        newSet.add(index);
        console.log('[WeeklyMemo] Expanding step:', index);
      }
      console.log('[WeeklyMemo] New expanded steps:', Array.from(newSet));
      return newSet;
    });
  };

  // Auto-expand next step when memo is saved
  const autoExpandNextStep = (currentPhase) => {
    if (currentPhase === 'originalMemo') {
      setExpandedSteps(prev => new Set([...prev, 1])); // Auto-expand AI Draft step
    } else if (currentPhase === 'aiDraft') {
      setExpandedSteps(prev => new Set([...prev, 2])); // Auto-expand Final Memo step
    } else if (currentPhase === 'finalMemo') {
      setExpandedSteps(prev => new Set([...prev, 3])); // Auto-expand Next Week Plan step
    }
  };

  // Add authentication check
  useEffect(() => {
    if (open && reportId) {
      // Check authentication status
      const userId = localStorage.getItem('userId');
      const tempId = localStorage.getItem('tempId');
      
      if (!userId && !tempId) {
        console.error('[WeeklyMemo] User not authenticated');
        alert('Please login first to use Weekly Memo feature');
        onClose();
        return;
      }
      
      console.log('[WeeklyMemo] Authentication check passed:', { userId, tempId });
      loadMemos();
    }
  }, [open, reportId]);

  // Load existing memos on component mount
  useEffect(() => {
    if (open && reportId) {
      loadMemos();
    }
  }, [open, reportId]);

  // Load memos from API
  const loadMemos = async () => {
    try {
      setLoading(true);
      const response = await apiService.reports.memos.list(reportId);
      
      if (response.data.success) {
        const memoData = response.data.data.memos;
        const updatedMemos = { ...memos };
        
        // Process each memo
        memoData.forEach(memo => {
          if (phases.find(p => p.key === memo.phase)) {
            updatedMemos[memo.phase] = {
              content: memo.content,
              timestamp: memo.timestamp
            };
          }
        });
        
        setMemos(updatedMemos);
        
        // Set expanded steps based on progress
        const expandedSet = new Set([0]); // Always show original memo step
        if (updatedMemos.originalMemo.content) {
          expandedSet.add(1); // Show AI draft step if original exists
        }
        if (updatedMemos.aiDraft.content) {
          expandedSet.add(2); // Show final memo step if AI draft exists
        }
        if (updatedMemos.finalMemo.content) {
          expandedSet.add(3); // Show next week plan step if final memo exists
        }
        setExpandedSteps(expandedSet);
      }
    } catch (error) {
      console.error('[WeeklyMemo] Load memos failed:', error);
      if (error.response?.status === 404) {
        setError('Please generate AI Progress Analysis first');
      } else {
        setError('Failed to load existing memos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle memo save
  const handleSaveMemo = async (phase, content) => {
    try {
      // Add authentication check before API call
      const userId = localStorage.getItem('userId');
      const tempId = localStorage.getItem('tempId');
      
      if (!userId && !tempId) {
        throw new Error('User not authenticated. Please log in first.');
      }

      console.log('[WeeklyMemo] Saving memo:', { 
        reportId, 
        phase, 
        content,
        userId,
        tempId
      });

      setLoading(true);
      setError('');
      
      let response;
      if (memos[phase].content) {
        // Update existing memo
        response = await apiService.reports.memos.update(reportId, phase, content);
      } else {
        // Add new memo
        response = await apiService.reports.memos.add(reportId, content, phase);
      }
      
      if (response.data.success) {
        setMemos(prev => ({
          ...prev,
          [phase]: {
            content: content,
            timestamp: new Date().toISOString()
          }
        }));
        
        setSuccess(`${phases.find(p => p.key === phase).label} saved successfully!`);
        setEditingPhase(null);
        
        // Auto-advance to next step
        autoExpandNextStep(phase);
      }
    } catch (error) {
      console.error('[WeeklyMemo] Save memo failed:', error);
      
      // Better error handling
      if (error.response?.status === 401) {
        alert('Authentication failed, please login again');
        // Redirect to appropriate login page
        const tempId = localStorage.getItem('tempId');
        if (tempId) {
          window.location.href = '/guest-login';
        } else {
          window.location.href = '/login';
        }
      } else if (error.response?.status === 404) {
        alert('Please generate AI Progress Analysis first');
      } else {
        alert(`Save failed: ${error.message}`);
      }
      
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle AI draft generation
  const handleGenerateAiDraft = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!memos.originalMemo.content) {
        setError('Please create an original memo first');
        return;
      }
      
      const response = await apiService.reports.memos.generateDraft(reportId);
      
      if (response.data.success) {
        setMemos(prev => ({
          ...prev,
          aiDraft: {
            content: response.data.data.content,
            timestamp: new Date().toISOString()
          }
        }));
        
        setSuccess('AI draft generated successfully!');
        autoExpandNextStep('aiDraft');
      }
    } catch (error) {
      console.error('[WeeklyMemo] Generate AI draft failed:', error);
      setError(error.response?.data?.error || 'Failed to generate AI draft');
    } finally {
      setLoading(false);
    }
  };

  // Handle Next Week Plan generation
  const handleGenerateNextWeekPlan = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if any of the first 3 phases have content
      const hasAnyMemo = memos.originalMemo.content || memos.aiDraft.content || memos.finalMemo.content;
      if (!hasAnyMemo) {
        setError('Please create at least one memo first');
        return;
      }
      
      const response = await apiService.reports.memos.generateNextWeekPlan(reportId);
      
      if (response.data.success) {
        setMemos(prev => ({
          ...prev,
          nextWeekPlan: {
            content: response.data.data.content,
            timestamp: new Date().toISOString()
          }
        }));
        
        setSuccess('Next week plan generated successfully!');
      }
    } catch (error) {
      console.error('[WeeklyMemo] Generate next week plan failed:', error);
      setError(error.response?.data?.error || 'Failed to generate next week plan');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit mode
  const handleEdit = (phase) => {
    setEditingPhase(phase);
    setTempContent(memos[phase].content);
    setError('');
    setSuccess('');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingPhase(null);
    setTempContent('');
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (tempContent.trim()) {
      handleSaveMemo(editingPhase, tempContent.trim());
    }
  };

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Render memo content
  const renderMemoContent = (phase) => {
    const phaseConfig = phases.find(p => p.key === phase);
    const memo = memos[phase];
    const isEditing = editingPhase === phase;
    
    return (
      <Box sx={{ mt: 2 }}>
        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              placeholder={phaseConfig.placeholder}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                disabled={loading || !tempContent.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            {memo.content ? (
              <Box>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {memo.content}
                    </Typography>
                    {memo.timestamp && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: 'text.secondary' }}>
                        <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption">
                          {new Date(memo.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
                <Button
                  variant="outlined"
                  onClick={() => handleEdit(phase)}
                  startIcon={<EditIcon />}
                  disabled={loading}
                >
                  Edit
                </Button>
              </Box>
            ) : (
              <Box>
                {phase === 'aiDraft' ? (
                  <Button
                    variant="contained"
                    onClick={handleGenerateAiDraft}
                    disabled={loading || !memos.originalMemo.content}
                    startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                    sx={{ mb: 2 }}
                  >
                    Generate AI Draft
                  </Button>
                ) : phase === 'nextWeekPlan' ? (
                  <Button
                    variant="contained"
                    onClick={handleGenerateNextWeekPlan}
                    disabled={loading || !(memos.originalMemo.content || memos.aiDraft.content || memos.finalMemo.content)}
                    startIcon={loading ? <CircularProgress size={16} /> : <ScheduleIcon />}
                    sx={{ mb: 2 }}
                  >
                    Generate Next Week Plan
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => handleEdit(phase)}
                    startIcon={<EditIcon />}
                    disabled={loading}
                  >
                    Create {phaseConfig.label}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Weekly Memo</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Error and Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        {/* Progress Stepper */}
        <Stepper orientation="vertical">
          {phases.map((phase, index) => {
            console.log(`[WeeklyMemo] Rendering step ${index}: ${phase.label}`, { 
              key: phase.key, 
              expanded: expandedSteps.has(index),
              memoContent: !!memos[phase.key].content 
            });
            return (
            <Step key={phase.key} completed={false} expanded={expandedSteps.has(index)}>
              <StepLabel
                icon={phase.icon}
                onClick={(e) => {
                  console.log(`[WeeklyMemo] StepLabel clicked - Step ${index} (${phase.label})`);
                  console.log('[WeeklyMemo] Event details:', e.target);
                  
                  // Auto-generate next week plan when clicked if not exists
                  if (phase.key === 'nextWeekPlan' && !memos.nextWeekPlan.content) {
                    handleGenerateNextWeekPlan();
                  }
                  
                  toggleStep(index);
                }}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    cursor: 'pointer'
                  },
                  '& .MuiStepLabel-labelContainer': {
                    cursor: 'pointer'
                  },
                  '& .MuiStepLabel-labelContainer:hover': {
                    cursor: 'pointer'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">{phase.label}</Typography>
                  {memos[phase.key].content && (
                    <Chip
                      label="Completed"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {phase.description}
                </Typography>
                {expandedSteps.has(index) && renderMemoContent(phase.key)}
              </StepContent>
            </Step>
            );
          })}
        </Stepper>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Floating Action Button Component
// DraggableFabContainer component for DND functionality
function DraggableFabContainer({ 
  children, 
  isDragging, 
  setIsDragging, 
  dragPosition, 
  setDragPosition 
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'weekly-memo-fab-container',
    data: {
      type: 'fab-container'
    }
  });

  const containerStyle = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 1000,
    transform: isDragging && transform ? 
      `translate(${dragPosition.x + transform.x}px, ${dragPosition.y + transform.y}px)` :
      `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    userSelect: 'none' // Prevent text selection during drag
  };

  // Drag handle style - top area for dragging
  const dragHandleStyle = {
    width: '80px',
    height: '8px',
    backgroundColor: isDragging ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
    borderRadius: '4px',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    marginBottom: '8px'
  };

  return children?.({
    ref: setNodeRef,
    containerStyle,
    dragHandleStyle,
    dragAttributes: attributes ?? {},
    dragListeners: listeners ?? {},
    isDragging
  });
}

export const WeeklyMemoFab = ({ reportId, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [hasNextWeekPlan, setHasNextWeekPlan] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [nextWeekContent, setNextWeekContent] = useState('');
  
  // DND state management
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  // DND sensors
  const sensors = [useSensor(PointerSensor)];

  // DND event handlers
  const handleDragStart = (event) => {
    console.log('[WeeklyMemoFab] Drag start:', event);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    console.log('[WeeklyMemoFab] Drag end:', event);
    setIsDragging(false);
    
    if (event.delta) {
      const { x, y } = dragPosition;
      setDragPosition({
        x: x + event.delta.x,
        y: y + event.delta.y
      });
    }
  };

  // Reset position when FAB is closed
  const handleFabClose = () => {
    setOpen(false);
    // Optionally reset position when closing
    // setDragPosition({ x: 0, y: 0 });
  };

  // Check if Next Week Plan exists and get content
  useEffect(() => {
    const checkNextWeekPlan = async () => {
      if (reportId) {
        try {
          const response = await apiService.reports.memos.list(reportId);
          if (response.data.success) {
            const nextWeekPlan = response.data.data.memos.find(memo => 
              memo.phase === 'nextWeekPlan' && memo.content
            );
            
            if (nextWeekPlan) {
              setHasNextWeekPlan(true);
              setNextWeekContent(nextWeekPlan.content);
              setExpanded(true); // Auto-expand when content exists
            } else {
              setHasNextWeekPlan(false);
              setNextWeekContent('');
              setExpanded(false); // Show icon when no content
            }
          }
        } catch (error) {
          console.error('[WeeklyMemoFab] Failed to check Next Week Plan:', error);
          setHasNextWeekPlan(false);
          setNextWeekContent('');
          setExpanded(false);
        }
      }
    };

    checkNextWeekPlan();
  }, [reportId]);

  const handleMainFabClick = () => {
    if (!disabled) {
      if (reportId) {
        setOpen(true);
      } else {
        alert('Please generate AI Progress Analysis first');
      }
    }
  };

  const handleNextWeekPlanClick = () => {
    if (!disabled && reportId) {
      if (expanded) {
        // If expanded, just open the dialog
        setOpen(true);
      } else {
        // If collapsed, toggle to expanded state
        setExpanded(true);
      }
    }
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      {/* DND Context for FAB Container */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <DraggableFabContainer
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          dragPosition={dragPosition}
          setDragPosition={setDragPosition}
        >
          {({ ref, containerStyle, dragHandleStyle, dragAttributes, dragListeners, isDragging: dragging }) => (
            <Box
              ref={ref}
              style={containerStyle}
              {...dragAttributes}
              sx={{
                opacity: dragging ? 0.8 : 1,
                transition: dragging ? 'none' : 'all 0.3s ease-in-out'
              }}
            >
              {/* Top Drag Handle - Single unified handle */}
              <Box
                {...dragListeners}
                sx={{
                  ...dragHandleStyle,
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.2)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: '20px',
                    height: '3px',
                    backgroundColor: 'currentColor',
                    opacity: 0.5,
                    borderRadius: '1.5px'
                  }}
                />
              </Box>
              
              {/* FAB Container */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {/* Secondary FAB - Next Week Plan */}
                {hasNextWeekPlan && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    {expanded ? (
                      // Expanded text box
                      <Box
                        onClick={handleToggleExpanded}
                        sx={{
                          backgroundColor: 'secondary.main',
                          color: 'white',
                          borderRadius: '16px',
                          padding: {
                            xs: '8px 12px',
                            sm: '12px 16px'
                          },
                          width: 'auto',
                          minWidth: {
                            xs: '100px',
                            sm: '120px'
                          },
                          maxWidth: {
                            xs: '60vw',
                            sm: '50vw',
                            md: '40vw'
                          },
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'secondary.dark',
                            transform: 'scale(1.02)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            lineHeight: 1.4,
                            fontSize: {
                              xs: '0.75rem',
                              sm: '0.875rem',
                              md: '0.875rem'
                            },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: (() => {
                              // Calculate line count based on content length
                              const contentLength = nextWeekContent.length;
                              if (contentLength <= 60) return 2;
                              if (contentLength <= 120) return 3;
                              if (contentLength <= 180) return 4;
                              return Math.min(Math.ceil(contentLength / 45), 6); // Max 6 lines
                            })(),
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {nextWeekContent}
                        </Typography>
                      </Box>
                    ) : (
                      // Collapsed icon
                      <Tooltip title="next move" placement="top">
                        <Fab
                          color="secondary"
                          size="large"
                          aria-label="next week plan"
                          onClick={handleNextWeekPlanClick}
                          disabled={disabled}
                          sx={{
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.3s ease-in-out',
                            width: 64,
                            height: 64,
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                            },
                            '& .MuiFab-label': {
                              fontSize: '2.5rem !important',
                              lineHeight: '1 !important'
                            },
                            '& svg, & span': {
                              fontSize: '2.5rem !important'
                            }
                          }}
                        >
                          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>📋</span>
                        </Fab>
                      </Tooltip>
                    )}
                  </Box>
                )}
                
                {/* Main FAB - Weekly Memo */}
                <Tooltip title="Weekly Memo with Advanced AI Assistant" placement="top">
                  <Fab
                    color="primary"
                    size="large"
                    aria-label="weekly memo"
                    onClick={handleMainFabClick}
                    disabled={disabled}
                    sx={{
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transition: 'all 0.3s ease-in-out',
                      width: 64,
                      height: 64,
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                      },
                      '& .MuiFab-label': {
                        fontSize: '2.5rem !important',
                        lineHeight: '1 !important'
                      },
                      '& svg, & span': {
                        fontSize: '2.5rem !important'
                      }
                    }}
                  >
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>🎯</span>
                  </Fab>
                </Tooltip>
              </Box>
            </Box>
          )}
        </DraggableFabContainer>
      </DndContext>
      
      {open && (
        <WeeklyMemo
          reportId={reportId}
          open={open}
          onClose={handleFabClose}
        />
      )}
    </>
  );
};

export default WeeklyMemo; 