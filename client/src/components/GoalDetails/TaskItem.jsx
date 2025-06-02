import { useState, useEffect } from 'react';
import styles from './TaskItem.module.css';

/**
 * TaskItem component displays a single task with checkbox
 * @param {Object} props
 * @param {Object} props.task - The task object with id, text, and completed
 * @param {Function} props.onStatusChange - Callback when task status changes
 * @param {Boolean} props.isMainTask - Whether this task is the main task from declaration
 */
export default function TaskItem({ task, onStatusChange, isMainTask = false }) {
  const [completed, setCompleted] = useState(task.completed);

  // Update local state when prop changes
  useEffect(() => {
    setCompleted(task.completed);
  }, [task.completed]);

  const handleToggle = () => {
    const newStatus = !completed;
    setCompleted(newStatus);
    
    // Call callback if provided
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <div className={`${styles.taskItem} ${isMainTask ? styles.mainTask : ''}`}>
      <input 
        type="checkbox" 
        checked={completed} 
        onChange={handleToggle}
        className={styles.taskCheckbox}
      />
      <span className={`${styles.taskText} ${completed ? styles.completed : ''} ${isMainTask ? styles.mainTaskText : ''}`}>
        {task.text}
        {isMainTask && <span className={styles.mainTaskLabel}>main task</span>}
      </span>
    </div>
  );
}
