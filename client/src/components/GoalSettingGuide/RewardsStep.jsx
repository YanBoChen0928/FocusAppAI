import React, { useState } from 'react';
import { Box, TextField, Typography, Grid, Button, List, ListItem, ListItemText, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Rewards Setting Step
 * Step 4: User can set multiple reward items (optional)
 */
const RewardsStep = ({ 
  rewards,
  onAddReward,
  onRemoveReward
}) => {
  const [newReward, setNewReward] = useState('');

  // Add reward
  const handleAddReward = () => {
    if (newReward.trim()) {
      onAddReward(newReward);
      setNewReward('');
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            My Reward System
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Set rewards for your progress and achievements, which will help you maintain motivation and positivity (optional).
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label="Add Reward"
              variant="outlined"
              value={newReward}
              onChange={(e) => setNewReward(e.target.value)}
              placeholder="For example: Watch a movie after completing a week of tasks, travel after achieving the goal..."
              inputProps={{ maxLength: 200 }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddReward}
              sx={{ ml: 1 }}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
          
          {rewards.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Added Rewards ({rewards.length})
              </Typography>
              <List dense>
                {rewards.map((reward, index) => (
                  <ListItem 
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => onRemoveReward(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={reward} />
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

export default RewardsStep; 