import React, { useState } from 'react';
import { Box, TextField, Typography, Grid, Button, List, ListItem, ListItemText, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Resources and Steps Setup
 * Step 3: User identifies resources and daily tasks (both optional, multiple can be added)
 */
const ResourcesStep = ({ 
  resources, 
  dailyTasks,
  onAddResource,
  onRemoveResource,
  onAddDailyTask,
  onRemoveDailyTask
}) => {
  const [newResource, setNewResource] = useState('');
  const [newDailyTask, setNewDailyTask] = useState('');

  // Add resource
  const handleAddResource = () => {
    if (newResource.trim()) {
      onAddResource(newResource);
      setNewResource('');
    }
  };

  // Add daily task
  const handleAddDailyTask = () => {
    if (newDailyTask.trim()) {
      onAddDailyTask(newDailyTask);
      setNewDailyTask('');
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            This goal is achievable because I have (abilities or resources)
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            List abilities, resources, or advantages you already have that will help you achieve your goal (optional).
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label="Add Resource"
              variant="outlined"
              value={newResource}
              onChange={(e) => setNewResource(e.target.value)}
              placeholder="For example: I already have basic knowledge, I have dedicated study time..."
              inputProps={{ maxLength: 200 }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddResource}
              sx={{ ml: 1 }}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
          
          {resources.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Added Resources ({resources.length})
              </Typography>
              <List dense>
                {resources.map((resource, index) => (
                  <ListItem 
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => onRemoveResource(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={resource} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Items I can track daily for this goal
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Set actionable small tasks. Continuous small progress will accumulate into significant results (optional).
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label="Add Daily Task"
              variant="outlined"
              value={newDailyTask}
              onChange={(e) => setNewDailyTask(e.target.value)}
              placeholder="For example: Read 20 pages of a professional book, Run for 30 minutes..."
              inputProps={{ maxLength: 200 }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddDailyTask}
              sx={{ ml: 1 }}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
          
          {dailyTasks.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Added Daily Tasks ({dailyTasks.length})
              </Typography>
              <List dense>
                {dailyTasks.map((task, index) => (
                  <ListItem 
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => onRemoveDailyTask(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={task} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResourcesStep; 