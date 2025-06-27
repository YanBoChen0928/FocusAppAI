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
  Chip
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
import apiService from '../services/api';

const WeeklyMemo = ({ reportId, onClose, open }) => {
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [memos, setMemos] = useState({
    originalMemo: { content: '', timestamp: null },
    aiDraft: { content: '', timestamp: null },
    finalMemo: { content: '', timestamp: null }
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
    }
  ];

  // Add authentication check
  useEffect(() => {
    if (open && reportId) {
      // Check authentication status
      const userId = localStorage.getItem('userId');
      const tempId = localStorage.getItem('tempId');
      
      if (!userId && !tempId) {
        console.error('[WeeklyMemo] User not authenticated');
        alert('请先登录后再使用Weekly Memo功能');
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
        
        // Set active step based on progress
        if (updatedMemos.finalMemo.content) {
          setActiveStep(2);
        } else if (updatedMemos.aiDraft.content) {
          setActiveStep(2);
        } else if (updatedMemos.originalMemo.content) {
          setActiveStep(1);
        } else {
          setActiveStep(0);
        }
      }
    } catch (error) {
      console.error('[WeeklyMemo] Load memos failed:', error);
      setError('Failed to load existing memos');
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
        if (phase === 'originalMemo') {
          setActiveStep(1);
        } else if (phase === 'finalMemo') {
          setActiveStep(2);
        }
      }
    } catch (error) {
      console.error('[WeeklyMemo] Save memo failed:', error);
      
      // Better error handling
      if (error.response?.status === 401) {
        alert('认证失败，请重新登录');
        // Redirect to appropriate login page
        const tempId = localStorage.getItem('tempId');
        if (tempId) {
          window.location.href = '/guest-login';
        } else {
          window.location.href = '/login';
        }
      } else if (error.response?.status === 404) {
        alert('报告未找到，请重新生成AI分析报告');
      } else {
        alert(`保存失败: ${error.message}`);
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
        setActiveStep(2);
      }
    } catch (error) {
      console.error('[WeeklyMemo] Generate AI draft failed:', error);
      setError(error.response?.data?.error || 'Failed to generate AI draft');
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
        <Stepper activeStep={activeStep} orientation="vertical">
          {phases.map((phase, index) => (
            <Step key={phase.key}>
              <StepLabel
                icon={phase.icon}
                onClick={() => setActiveStep(index)}
                sx={{ cursor: 'pointer' }}
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
                {renderMemoContent(phase.key)}
              </StepContent>
            </Step>
          ))}
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
export const WeeklyMemoFab = ({ reportId, disabled = false }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!disabled && reportId) {
      setOpen(true);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="weekly memo"
        onClick={handleClick}
        disabled={disabled}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        🎯
      </Fab>
      
      {open && (
        <WeeklyMemo
          reportId={reportId}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default WeeklyMemo; 