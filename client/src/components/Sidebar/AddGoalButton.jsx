import React from 'react';
import styles from './GoalCard.module.css';

export default function AddGoalButton({ onAddGoalClick, disabled }) {
  return (
    <button 
      className={`${styles.addGoalButton} ${disabled ? styles.disabled : ''}`} 
      onClick={onAddGoalClick}
      disabled={disabled}
    >
      Add New Goal
    </button>
  );
}
