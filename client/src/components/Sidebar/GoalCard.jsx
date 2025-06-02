import React, { useState, useEffect } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from '@mui/icons-material/Archive';
import EventIcon from '@mui/icons-material/Event';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import apiService from "../../services/api";
import axios from 'axios';
import styles from './GoalCard.module.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export default function GoalCard({ goal, onPriorityChange, onDateChange, onGoalArchived }) {
  // Use nullish coalescing operator to ensure safe access
  const safeGoal = goal || {};
  const goalId = safeGoal._id || safeGoal.id;
  const goalTitle = safeGoal.title || "Unnamed Goal";
  const goalStatus = safeGoal.status || "active";
  const isArchived = goalStatus === 'archived';
  
  // Hooks must be called at the top level of the component
  const [anchorEl, setAnchorEl] = useState(null);
  const [priority, setPriority] = useState(safeGoal.priority || "Medium");
  const [targetDate, setTargetDate] = useState(() => {
    const initialDate = safeGoal.targetDate || safeGoal.dueDate;
    return initialDate ? new Date(initialDate) : null;
  });
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState(null);
  const [isValid, setIsValid] = useState(!!goal && typeof goal === 'object');

  // Create custom theme
  const defaultTheme = createTheme({
    shadows: [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
      '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
      '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
      '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
      '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
      '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
      '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
      '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
      '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
      '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
      '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
      '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
      '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
      '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
      '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
      '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
      '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
      '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
      '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
    ],
    palette: {
      primary: {
        main: '#0D5E6D',
        light: '#4CD7D0',
        dark: '#0a4a56',
        contrastText: '#fff',
      },
    },
  });

  // Set component validity
  useEffect(() => {
    setIsValid(!!goal && typeof goal === 'object');
  }, [goal]);

  // Sync state with props
  useEffect(() => {
    if (!isValid) return;

    // Update priority
    if (safeGoal.priority && safeGoal.priority !== priority) {
      setPriority(safeGoal.priority);
    }

    // Update target date
    const newDate = safeGoal.targetDate || safeGoal.dueDate;
    if (newDate) {
      const newDateObj = new Date(newDate);
      const needsUpdate = !targetDate || targetDate.getTime() !== newDateObj.getTime();
      if (needsUpdate) {
        setTargetDate(newDateObj);
      }
    } else if (targetDate !== null) {
      setTargetDate(null);
    }
  }, [isValid, safeGoal.priority, safeGoal.targetDate, safeGoal.dueDate, priority, targetDate]);

  // Menu handler functions
  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Priority change handler
  const handlePriorityChange = async (newPriority) => {
    try {
      handleCloseMenu();
      if (newPriority === priority || !isValid) return;

      const oldPriority = priority;
      setPriority(newPriority); // UI immediately updates

      if (onPriorityChange) {
        onPriorityChange(goalId, newPriority);
      }

      try {
        const response = await apiService.goals.update(goalId, {
          priority: newPriority,
        });
        if (response?.data?.success && response.data.data && onPriorityChange) {
          onPriorityChange(goalId, newPriority, response.data.data);
        }
      } catch (apiError) {
        console.error("API failed to update goal priority:", apiError);
        setPriority(oldPriority); // Rollback UI
        if (onPriorityChange) {
          onPriorityChange(goalId, oldPriority);
        }
      }
    } catch (error) {
      console.error("Failed to update goal priority:", error);
    }
  };

  // Date change handler
  const handleDateChange = async (newDate) => {
    if (!isValid) return;
    
    const dateChanged = (!newDate && targetDate) || 
                        (newDate && !targetDate) || 
                        (newDate && targetDate && newDate.getTime() !== targetDate.getTime());
    
    if (!dateChanged) return;

    const oldDate = targetDate;
    setTargetDate(newDate);

    if (onDateChange) {
      onDateChange(goalId, newDate);
    }

    try {
      const response = await apiService.goals.update(goalId, {
        targetDate: newDate,
      });
      if (response?.data?.success && response.data.data && onDateChange) {
        onDateChange(goalId, newDate, response.data.data);
      }
    } catch (error) {
      console.error("date update failed:", error);
      setTargetDate(oldDate);
      if (onDateChange) {
        onDateChange(goalId, oldDate);
      }
    }
  };

  // Archive handler
  const handleArchive = async () => {
    if (isArchiving || !isValid) return;
    
    setIsArchiving(true);
    setArchiveError(null);

    try {
      const response = await axios.put(
        `/api/goals/${goalId}/status`,
        { status: 'archived' },
        { withCredentials: true }
      );
      
      if (response.data && response.data.success) {
        if (onGoalArchived) {
          onGoalArchived(goalId);
        }
      } else {
        throw new Error(response.data?.error?.message || 'Failed to archive goal');
      }
    } catch (err) {
      console.error(`Error archiving goal ${goalId}:`, err);
      setArchiveError(err.message || 'Could not archive goal.');
      setIsArchiving(false);
    }
  };

  // Render when goal object is invalid
  if (!isValid) {
    return (
      <div className="goal-card error">
        <h5>Invalid Goal Data</h5>
      </div>
    );
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <div className={`${styles.goalCard} ${goalStatus === "active" ? styles.active : ""}`}>
        {/* Header Area */}
        <div className={styles.goalCardHeader}>
          <h5 className={styles.goalTitle}>
            <Tooltip title={isArchived ? "Goal Archived" : "Complete and archive"}>
              <div className={styles.titleActions}>
                <IconButton
                  className={styles.iconButton}
                  onClick={(e) => { e.stopPropagation(); handleArchive(); }}
                  disabled={isArchiving || isArchived}
                  size="small"
                >
                  {isArchiving ? <CircularProgress size={20} /> : <ArchiveIcon fontSize="small" />}
                </IconButton>
              </div>
            </Tooltip>
            <span className={styles.goalTitleText}>
              {goalTitle}
            </span>
            
            {/* Priority Section */}
            <Box 
              component="span" 
              className={styles.priorityContainer}
            >
              <Chip
                size="small"
                label={priority}
                className={`${styles.priorityChip} ${
                  priority === "High" 
                    ? styles.priorityHigh 
                    : priority === "Medium" 
                      ? styles.priorityMedium 
                      : styles.priorityLow
                }`}
                onClick={handleOpenMenu}
                clickable
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                  elevation: 8,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                    borderRadius: '8px',
                    mt: 1.5,
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem 
                  onClick={() => handlePriorityChange("High")}
                  className={styles.priorityHighMenuItem}
                  selected={priority === 'High'}
                >
                  High
                </MenuItem>
                <MenuItem 
                  onClick={() => handlePriorityChange("Medium")}
                  className={styles.priorityMediumMenuItem}
                  selected={priority === 'Medium'}
                >
                  Medium
                </MenuItem>
                <MenuItem 
                  onClick={() => handlePriorityChange("Low")}
                  className={styles.priorityLowMenuItem}
                  selected={priority === 'Low'}
                >
                  Low
                </MenuItem>
              </Menu>
            </Box>
          </h5>
        </div>

        {/* Date Section */}
        <div className={styles.cardFooter}>
          {isArchived ? (
            <div className={styles.dueDate}>
              <EventIcon className={styles.dateIcon} />
              <span>Completed on {targetDate ? new Date(targetDate).toLocaleDateString() : 'Unknown date'}</span>
            </div>
          ) : (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Target Date"
                value={targetDate}
                onChange={handleDateChange}
                disablePast
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "small",
                    InputLabelProps: { shrink: true },
                  },
                  actionBar: { actions: ['clear', 'today', 'accept'] },
                  day: { 
                    disableAutoFocus: true,
                    autoFocus: false
                  }
                }}
                closeOnSelect={false}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
          )}
          
          {/* Display archive error subtly */}
          {archiveError && <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'right', marginTop: 0.5 }}>Archive failed</Typography>}
        </div>
      </div>
    </ThemeProvider>
  );
}
