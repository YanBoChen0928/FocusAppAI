import React, { useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RewardItem from './RewardItem';

/**
 * DailyReward component displays the daily reward for a goal with a checkbox to mark as claimed
 * @param {Object} props
 * @param {string} props.reward - The daily reward text
 * @param {boolean} props.claimed - Whether the reward has been claimed
 * @param {Function} props.onClaimedChange - Callback for when claimed status changes
 * @param {boolean} props.disabled - Whether the checkbox should be disabled
 * @param {boolean} props.isMainReward - Whether this is the main reward from declaration
 */
export default function DailyReward({ 
  reward, 
  claimed = false, 
  onClaimedChange, 
  disabled = false,
  isMainReward = true // Default to true as typically this is the main reward
}) {
  // Log props for debugging
  useEffect(() => {
    console.log('DailyReward component rendered with props:', {
      reward,
      claimed,
      disabled,
      isMainReward
    });
  }, [reward, claimed, disabled, isMainReward]);

  return (
    <Box className="daily-reward" sx={{ my: 2, p: 1, borderTop: '1px solid #eee' }}>
      <Typography variant="h6" sx={{ 
        mb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <span>Daily Reward</span>
        {disabled && !claimed && (
          <Tooltip 
            title="Complete the main task first to claim this reward" 
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(13, 94, 109, 0.9)'
                }
              }
            }}
          >
            <InfoIcon fontSize="small" sx={{ color: 'rgba(0, 0, 0, 0.5)', ml: 1 }} />
          </Tooltip>
        )}
      </Typography>
      
      <RewardItem 
        reward={reward}
        claimed={claimed}
        onClaimedChange={onClaimedChange}
        isMainReward={isMainReward}
        disabled={disabled}
      />
    </Box>
  );
}
