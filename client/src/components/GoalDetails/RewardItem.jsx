import { useState, useEffect } from 'react';
import styles from './RewardItem.module.css';

/**
 * RewardItem component displays a single reward with checkbox
 * @param {Object} props
 * @param {string} props.reward - The reward text
 * @param {boolean} props.claimed - Whether the reward has been claimed
 * @param {Function} props.onClaimedChange - Callback when claimed status changes
 * @param {boolean} props.isMainReward - Whether this is the main reward from declaration
 * @param {boolean} props.disabled - Whether the checkbox should be disabled
 */
export default function RewardItem({ 
  reward, 
  claimed = false, 
  onClaimedChange, 
  isMainReward = false, 
  disabled = false 
}) {
  const [isClaimed, setIsClaimed] = useState(claimed);

  // Update local state when prop changes
  useEffect(() => {
    setIsClaimed(claimed);
  }, [claimed]);

  const handleToggle = () => {
    if (disabled) return;
    
    const newStatus = !isClaimed;
    setIsClaimed(newStatus);
    
    // Call callback if provided
    if (onClaimedChange) {
      onClaimedChange(newStatus);
    }
  };

  return (
    <div className={`${styles.rewardItem} ${isMainReward ? styles.mainReward : ''}`}>
      <input 
        type="checkbox" 
        checked={isClaimed} 
        onChange={handleToggle}
        disabled={disabled}
        className={styles.rewardCheckbox}
      />
      <span 
        className={`${styles.rewardText} ${isClaimed ? styles.claimed : ''} ${isMainReward ? styles.mainRewardText : ''}`}
      >
        {reward || 'No reward set'}
      </span>
    </div>
  );
} 