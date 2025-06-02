import React from 'react';
import { Card, CardContent, Checkbox, Typography, Chip } from '@mui/material';

/**
 * TaskCard - display a single task
 * 
 * @param {Object} props
 * @param {Object} props.task - task object
 * @param {Function} props.onTaskStatusChange - task status change callback
 * @returns {JSX.Element}
 */
function TaskCard({ task, onTaskStatusChange }) {
  if (!task) return null;

  const handleStatusChange = (event) => {
    if (onTaskStatusChange) {
      onTaskStatusChange(task._id, event.target.checked);
    }
  };

  // handle task status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card className="task-card">
      <CardContent>
        <div className="task-header">
          <div className="task-status">
            <Checkbox 
              checked={task.status === 'completed'} 
              onChange={handleStatusChange}
            />
            <Typography 
              variant="body1" 
              className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}
            >
              {task.title}
            </Typography>
          </div>
          <Chip 
            label={task.status || 'pending'} 
            color={getStatusColor(task.status)}
            size="small"
            className="task-status-chip"
          />
        </div>
        {task.description && (
          <Typography variant="body2" color="textSecondary" className="task-description">
            {task.description}
          </Typography>
        )}
        {task.dueDate && (
          <Typography variant="caption" className="task-due-date">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default TaskCard; 