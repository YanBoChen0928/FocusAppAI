import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  Divider,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  InputAdornment,
  Checkbox,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArchiveIcon from '@mui/icons-material/Archive';
import DailyTasks from './DailyTasks';
import DailyReward from './DailyReward';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';
import useRewardsStore from '../../store/rewardsStore';
import useMainTaskStore from '../../store/mainTaskStore';

/**
 * DailyCardRecord component displays and manages a daily card with tasks, rewards, and progress records
 * @param {Object} props
 * @param {Object} props.goal - The goal object
 * @param {string} props.date - The date of the daily card in format YYYY-MM-DD
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback for when dialog is closed
 * @param {Function} props.onSave - Callback for when changes are saved
 * @param {Function} props.onViewDeclaration - Callback to view declaration
 * @param {boolean} props.isArchived - Whether the goal is archived
 */
export default function DailyCardRecord({
  goal,
  date,
  open,
  onClose,
  onSave,
  onViewDeclaration,
  isArchived = false
}) {
  // Get reward from Zustand store
  const getGoalReward = useRewardsStore(state => state.getGoalReward);
  const setGoalReward = useRewardsStore(state => state.setGoalReward);
  
  // Get main task from Zustand store
  const getMainTask = useMainTaskStore(state => state.getMainTask);
  
  // Format the date for display (e.g., "4/9 Wednesday")
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    
    return `${month}/${day} ${weekday}`;
  };
  
  // Add a separate function for date comparison
  const getSimpleDateString = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '';
    }
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // State for the daily card data
  const [cardData, setCardData] = useState({
    date: date,
    dailyTask: '',
    dailyReward: '',
    completed: {
      dailyTask: false,
      dailyReward: false
    },
    taskCompletions: {}, // 用于存储每个任务的独立完成状态
    records: []
  });

  // State for new record input
  const [newRecord, setNewRecord] = useState('');

  // Loading and error states
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // State for new task input and task editing
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [taskDeleteConfirmOpen, setTaskDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // State for tracking changes
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
  
  // When a new record is added or tasks are changed, mark as having changes
  const markAsChanged = () => {
    setHasUserMadeChanges(true);
  };
  
  // Update markAsChanged for newRecord change
  useEffect(() => {
    if (newRecord.trim()) {
      markAsChanged();
    }
  }, [newRecord]);
  
  // Reset change tracking when component mounts with new data
  useEffect(() => {
    if (open) {
      setHasUserMadeChanges(false);
    }
  }, [open, date]);

  // Handle viewing declaration details
  const handleViewDeclaration = () => {
    // Check if callback exists and call it with the goal object
    if (onViewDeclaration && goal) {
      console.log('Opening goal declaration dialog', goal);
      onClose(); // Close current dialog first
      onViewDeclaration(goal); // Then open declaration dialog
      return;
    }
    console.warn('Cannot open declaration dialog: onViewDeclaration callback not provided or goal is empty');
  };

  // Initialize card data when the component opens
  useEffect(() => {
    if (!goal || !date || !open) return;
    
    const goalId = goal._id || goal.id;
    
    // 尝试从Zustand获取奖励
    const zustandReward = goalId ? getGoalReward(goalId) : null;
    console.log('From Zustand store - reward:', zustandReward);
    
    // 尝试从Zustand获取主任务
    const zustandMainTask = goalId ? getMainTask(goalId) : null;
    console.log('From Zustand store - main task:', zustandMainTask);
    
    // Check if there's an existing card for this date
    const existingCard = goal.dailyCards?.find(card => 
      card.date && formatDisplayDate(new Date(card.date)) === formatDisplayDate(new Date(date))
    );

    // 确保 taskCompletions 对象存在
    const taskCompletions = existingCard?.taskCompletions || {};
    
    // Format dates for comparison 
    const todayFormatted = formatDisplayDate(new Date());
    const cardDateFormatted = formatDisplayDate(new Date(date));
    
    if (existingCard) {
      console.log(`Found existing card for ${cardDateFormatted}:`, existingCard);
      
      // Use new date comparison method to determine if it's today or a future date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const cardDate = new Date(date);
      cardDate.setHours(0, 0, 0, 0);
      
      const isCurrentOrFutureDate = cardDate >= today;
      
      console.log('Date comparison:', {
        today: today.toISOString(),
        cardDate: cardDate.toISOString(),
        isCurrentOrFutureDate
      });
      
      if (isCurrentOrFutureDate) {
        // For today or future dates, update with latest settings but preserve completion status
        setCardData({
          ...existingCard,
          // 今天和将来的日期使用Zustand中的最新主任务
          dailyTask: zustandMainTask || goal.currentSettings?.dailyTask || existingCard.dailyTask || '',
          // Try to use reward from Zustand first, then fallback to other sources
          dailyReward: zustandReward || goal.currentSettings?.dailyReward || existingCard.dailyReward || '',
          // Ensure records is an array
          records: Array.isArray(existingCard.records) ? existingCard.records : [],
          taskCompletions // 保留任务完成状态
        });
      } else {
        // For past dates, use existing card data unchanged, including existing dailyTask
        setCardData({
          ...existingCard,
          // 过去的日期保留原有的主任务，不使用Zustand中的最新主任务
          dailyTask: existingCard.dailyTask || '',
          // Still prefer Zustand reward if available for consistency in UI
          dailyReward: zustandReward || existingCard.dailyReward || '',
          records: Array.isArray(existingCard.records) ? existingCard.records : [],
          taskCompletions // 保留任务完成状态
        });
      }
    } else {
      // 初始化任务完成状态为全部未完成
      const taskCompletions = {};
      if (goal && goal.dailyTasks && goal.dailyTasks.length > 0) {
        goal.dailyTasks.forEach((taskText) => {
          // 使用与任务列表生成相同的ID逻辑
          const taskId = `task-${taskText.replace(/\s+/g, '-').toLowerCase()}`;
          taskCompletions[taskId] = false;
        });
      }
      
      // 对主任务也创建完成状态
      const mainTask = zustandMainTask || goal.currentSettings?.dailyTask || '';
      if (mainTask) {
        // 使用与任务列表生成相同的ID逻辑
        const taskId = `daily-task-${mainTask.replace(/\s+/g, '-').toLowerCase()}`;
        taskCompletions[taskId] = false;
      }
      
      // Create new card with current goal settings
      setCardData({
        date: date,
        // 优先使用 Zustand 中的主任务
        dailyTask: mainTask,
        // Use Zustand reward for new cards too
        dailyReward: zustandReward || goal.currentSettings?.dailyReward || '',
        completed: {
          dailyTask: false,
          dailyReward: false
        },
        taskCompletions, // 添加初始任务完成状态
        records: []  // Empty array for new cards
      });
    }

    // Log the state for debugging
    console.log('Daily card data initialized:', {
      date,
      existingCard: existingCard ? 'found' : 'not found',
      zustandMainTask,
      zustandReward,
      finalTask: zustandMainTask || goal.currentSettings?.dailyTask || (existingCard?.dailyTask || ''),
      finalReward: zustandReward || goal.currentSettings?.dailyReward || (existingCard?.dailyReward || ''),
      recordsType: existingCard ? (Array.isArray(existingCard.records) ? 'array' : typeof existingCard.records) : 'N/A',
      taskCompletionsLoaded: existingCard ? (existingCard.taskCompletions ? 'yes' : 'no') : 'N/A'
    });
  }, [goal, date, open, getGoalReward, getMainTask]);

  // Effect to update reward when goal settings change
  useEffect(() => {
    if (goal?.currentSettings?.dailyReward) {
      console.log('Detected dailyReward change in goal settings:', goal.currentSettings.dailyReward);
      
      setCardData(prevData => {
        // Only update if different from current value
        if (prevData.dailyReward !== goal.currentSettings.dailyReward) {
          console.log('Updating dailyReward in cardData:', goal.currentSettings.dailyReward);
          return {
            ...prevData,
            dailyReward: goal.currentSettings.dailyReward
          };
        }
        return prevData;
      });
    }
  }, [goal?.currentSettings?.dailyReward]);

  // Add an effect to update rewards when the goal object changes
  // This will ensure that changes made in the GoalDeclaration component are reflected

  useEffect(() => {
    if (goal?._id) {
      // Check if the goal has rewards data
      if (goal.rewards?.length > 0 || goal.currentSettings?.dailyReward) {
        const rewardToUse = goal.currentSettings?.dailyReward || (goal.rewards?.length > 0 ? goal.rewards[0] : null);
        
        if (rewardToUse) {
          console.log('Goal updated with new reward data:', {
            goalId: goal._id,
            reward: rewardToUse
          });
          
          // Update Zustand store
          setGoalReward(goal._id, rewardToUse);
        }
      }
    }
  }, [goal?.rewards, goal?.currentSettings?.dailyReward, goal?._id, setGoalReward]);

  // Handle task status change
  const handleTaskStatusChange = async (taskId, completed) => {
    console.log(`任务状态变更开始: ${taskId} => ${completed}`);
    
    try {
      if (!goal || !goal._id) {
        console.error('无效的目标数据:', goal);
        toast.error('无法保存，目标数据无效');
        return;
      }

      // 确保日期格式正确
      if (!date) {
        console.error('无效的日期:', date);
        toast.error('无法保存，日期数据无效');
        return;
      }

      // Mark that user has made changes
      markAsChanged();
      
      // 先创建新的任务完成状态对象，再更新本地状态
      // 这确保我们不会修改引用同一对象
      const newTaskCompletions = {
        ...cardData.taskCompletions
      };
      
      // 明确更新状态值 
      newTaskCompletions[taskId] = completed;
      
      console.log('任务状态变化:', {
        任务ID: taskId,
        新状态: completed,
        原状态: cardData.taskCompletions[taskId],
        更新后对象: newTaskCompletions
      });
      
      // 创建新的cardData对象，避免直接修改原对象
      const updatedCard = {
        ...cardData,
        taskCompletions: newTaskCompletions
      };
      
      // 先更新UI状态
      setCardData(updatedCard);
      
      // 准备日期格式
      const formattedDate = new Date(date).toISOString();
      console.log('格式化的日期:', formattedDate);
      
      // 准备发送到服务器的数据
      const payload = {
        date: formattedDate,
        dailyTask: updatedCard.dailyTask,
        dailyReward: updatedCard.dailyReward,
        completed: updatedCard.completed || { dailyTask: false, dailyReward: false },
        records: updatedCard.records || [],
        taskCompletions: newTaskCompletions  // 使用新创建的状态对象
      };
      
      console.log('正在保存任务状态到数据库:', {
        目标ID: goal._id,
        日期: payload.date,
        任务ID: taskId,
        完成状态: completed,
        完整载荷: payload
      });
      
      // 使用apiService发送请求
      const response = await apiService.goals.addOrUpdateDailyCard(goal._id, payload);
      
      console.log('任务状态已保存, 响应:', response);
      
      // 显示成功消息
      toast.success('任务状态已保存');
      
      // 通知父组件更新
      if (onSave) {
        console.log('Calling onSave callback with updatedCard data');
        // Pass the locally constructed updatedCard, consistent with handleTaskStatusChange
        onSave(updatedCard); 
      } else {
        console.log('No onSave callback provided');
      }
    } catch (error) {
      console.error('保存任务状态失败:', error);
      toast.error('保存任务状态失败，请重试');
    }
  };

  // Handle reward status change
  const handleRewardStatusChange = async (claimed) => {
    console.log(`奖励状态变更开始: => ${claimed}`);
    
    try {
      if (!goal || !goal._id) {
        console.error('无效的目标数据:', goal);
        toast.error('无法保存，目标数据无效');
        return;
      }

      // 确保日期格式正确
      if (!date) {
        console.error('无效的日期:', date);
        toast.error('无法保存，日期数据无效');
        return;
      }

      // Mark that user has made changes
      markAsChanged();
      
      // 创建新的cardData对象，避免直接修改原对象
      const updatedCard = {
        ...cardData,
        completed: {
          ...cardData.completed,
          dailyReward: claimed
        }
      };
      
      // 先更新UI状态
      setCardData(updatedCard);
      
      // 准备日期格式
      const formattedDate = new Date(date).toISOString();
      
      // 准备发送到服务器的数据
      const payload = {
        date: formattedDate,
        dailyTask: updatedCard.dailyTask,
        dailyReward: updatedCard.dailyReward,
        completed: updatedCard.completed,
        records: updatedCard.records || [],
        taskCompletions: updatedCard.taskCompletions
      };
      
      console.log('正在保存奖励状态到数据库:', {
        目标ID: goal._id,
        日期: payload.date,
        奖励状态: claimed,
        完整载荷: payload
      });
      
      // 使用apiService发送请求
      const response = await apiService.goals.addOrUpdateDailyCard(goal._id, payload);
      
      console.log('奖励状态已保存, 响应:', response);
      
      // 显示成功消息
      toast.success('奖励状态已保存');
      
      // 通知父组件更新
      if (onSave) {
        onSave(updatedCard); 
      }
    } catch (error) {
      console.error('保存奖励状态失败:', error);
      toast.error('保存奖励状态失败，请重试');
    }
  };

  // Handle adding a new progress record
  const handleAddRecord = (e) => {
    // For Enter key press
    if (e.key === 'Enter' && newRecord.trim()) {
      addNewRecord();
      return;
    }
    
    // For button click
    if (!e.key && newRecord.trim()) {
      addNewRecord();
    }
  };

  // Add new record helper function
  const addNewRecord = () => {
    if (!newRecord.trim()) return;

    // Mark that user has made changes
    markAsChanged();
    
    setCardData(prev => {
      // Ensure records is an array
      const prevRecords = Array.isArray(prev.records) ? prev.records : [];

      return {
        ...prev,
        records: [
          ...prevRecords,
          {
            content: newRecord.trim(),
            createdAt: new Date().toISOString()
          }
        ]
      };
    });
    setNewRecord('');
  };

  // Handle initiating record deletion - opens confirmation dialog
  const handleInitiateDelete = (index) => {
    setRecordToDelete(index);
    setDeleteConfirmOpen(true);
  };

  // Handle canceling record deletion
  const handleCancelDelete = () => {
    setRecordToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // Handle confirming record deletion
  const handleConfirmDelete = () => {
    if (recordToDelete !== null) {
      // Mark that user has made changes
      markAsChanged();
      
      setCardData(prev => {
        // Ensure records is an array
        const prevRecords = Array.isArray(prev.records) ? prev.records : [];

        return {
          ...prev,
          records: prevRecords.filter((_, i) => i !== recordToDelete)
        };
      });

      // Close dialog and reset state
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);

      // Show success message
      setSuccess('Record deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Handle adding a new daily task
  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    
    try {
      setIsSaving(true);
      
      // Mark that user has made changes
      markAsChanged();
      
      // 使用与任务列表生成相同的ID逻辑
      const taskText = newTaskText.trim();
      const newTaskId = `task-${taskText.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update goal's dailyTasks array
      const updatedDailyTasks = [...(goal.dailyTasks || []), taskText];
      
      // Update local state for task completions
      setCardData(prev => ({
        ...prev,
        taskCompletions: {
          ...prev.taskCompletions,
          [newTaskId]: false
        }
      }));
      
      // Call API to update the goal
      await apiService.goals.update(goal._id, {
        dailyTasks: updatedDailyTasks
      });
      
      // Update local goal data
      goal.dailyTasks = updatedDailyTasks;
      
      // Clear input field
      setNewTaskText('');
      
      // Show success message
      setSuccess('New daily task added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to add daily task:', error);
      setError(`Failed to add daily task: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle initiating task edit
  const handleInitiateTaskEdit = (taskId, taskText) => {
    setEditingTaskId(taskId);
    setEditingTaskText(taskText);
  };
  
  // Handle canceling task edit
  const handleCancelTaskEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
  };
  
  // Handle saving task edit
  const handleSaveTaskEdit = async (taskId, taskIndex) => {
    if (!editingTaskText.trim()) return;
    
    try {
      setIsSaving(true);
      
      // Mark that user has made changes
      markAsChanged();
      
      // Update goal's dailyTasks array
      const updatedDailyTasks = [...goal.dailyTasks];
      updatedDailyTasks[taskIndex] = editingTaskText.trim();
      
      // Call API to update the goal
      await apiService.goals.update(goal._id, {
        dailyTasks: updatedDailyTasks
      });
      
      // Update local goal data
      goal.dailyTasks = updatedDailyTasks;
      
      // Reset editing state
      setEditingTaskId(null);
      setEditingTaskText('');
      
      // Show success message
      setSuccess('Daily task updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update daily task:', error);
      setError(`Failed to update daily task: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle initiating task deletion
  const handleInitiateTaskDelete = (taskId, taskIndex) => {
    setTaskToDelete({ id: taskId, index: taskIndex });
    setTaskDeleteConfirmOpen(true);
  };
  
  // Handle canceling task deletion
  const handleCancelTaskDelete = () => {
    setTaskToDelete(null);
    setTaskDeleteConfirmOpen(false);
  };
  
  // Handle confirming task deletion
  const handleConfirmTaskDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      setIsSaving(true);
      
      // Mark that user has made changes
      markAsChanged();
      
      // Remove task from goal's dailyTasks array
      const updatedDailyTasks = [...goal.dailyTasks];
      updatedDailyTasks.splice(taskToDelete.index, 1);
      
      // Call API to update the goal
      await apiService.goals.update(goal._id, {
        dailyTasks: updatedDailyTasks
      });
      
      // Update local goal data
      goal.dailyTasks = updatedDailyTasks;
      
      // Close dialog and reset state
      setTaskDeleteConfirmOpen(false);
      setTaskToDelete(null);
      
      // Show success message
      setSuccess('Daily task deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete daily task:', error);
      setError(`Failed to delete daily task: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Tasks for the DailyTasks component
  const tasksForComponent = [];
  
  // 首先检查是否有主任务，并优先添加到列表
  const mainTask = getMainTask(goal?._id);
  if (mainTask) {
    const mainTaskId = `main-task-${mainTask.replace(/\s+/g, '-').toLowerCase()}`;
    tasksForComponent.push({
      id: mainTaskId,
      text: mainTask,
      completed: cardData.taskCompletions[mainTaskId] || false,
      isMainTask: true // 标记为主任务
    });
  }
  
  // 然后添加其他任务
  if (goal && goal.dailyTasks && goal.dailyTasks.length > 0) {
    goal.dailyTasks.forEach((taskText, index) => {
      const taskId = `task-${taskText.replace(/\s+/g, '-').toLowerCase()}`;
      // 确保我们不会添加重复的主任务
      if (taskText !== mainTask) {
        tasksForComponent.push({
          id: taskId,
          text: taskText,
          completed: cardData.taskCompletions[taskId] || false,
          index: index
        });
      }
    });
  }
  
  // 如果cardData有dailyTask，也添加到列表（保持兼容）
  if (cardData.dailyTask && !tasksForComponent.some(task => task.text === cardData.dailyTask)) {
    const taskId = `daily-task-${cardData.dailyTask.replace(/\s+/g, '-').toLowerCase()}`;
    tasksForComponent.push({
      id: taskId,
      text: cardData.dailyTask,
      completed: cardData.taskCompletions[taskId] || false,
      isLegacy: true // 标记为旧格式的任务
    });
  }

  const displayDate = formatDisplayDate(date);

  // Handle saving changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      if (!goal || !goal._id) {
        console.error('Invalid goal data for save:', goal);
        throw new Error('Invalid goal data');
      }
      
      // 確保日期格式正確，使用本地時間處理
      let cardDate;
      try {
        if (!date) {
          console.error('无效的日期数据:', date);
          throw new Error('Invalid date data');
        }
        
        cardDate = new Date(date);
        
        if (isNaN(cardDate.getTime())) {
          console.error('Invalid date format:', date);
          throw new Error('Invalid date format');
        }
      } catch (error) {
        console.error('Error creating date object:', error, date);
        setError('Invalid date format. Please try again.');
        setIsSaving(false);
        return;
      }
      
      // 确保taskCompletions对象已定义，并深拷贝以避免引用问题
      const safeTaskCompletions = JSON.parse(JSON.stringify(cardData.taskCompletions || {}));
      
      // 打印当前任务完成状态，便于调试
      console.log('DailyCardRecord - handleSave - 保存时的任务完成状态:', {
        目标ID: goal._id,
        日期: date,
        总任务数: Object.keys(safeTaskCompletions).length,
        已完成数: Object.values(safeTaskCompletions).filter(Boolean).length,
        详细状态: safeTaskCompletions
      });
      
      // 打印即将保存的记录
      console.log('DailyCardRecord - handleSave - 保存时的记录:', cardData.records);
      
      // 準備發送給API的數據 - 使用 ISO 格式
      const updatedCard = {
        ...JSON.parse(JSON.stringify(cardData)), // 深拷贝避免引用问题
        date: cardDate.toISOString(),
        taskCompletions: safeTaskCompletions // 使用安全处理后的任务完成状态
      };
      
      // 确保completed字段存在且包含正确的值
      if (!updatedCard.completed) {
        updatedCard.completed = { dailyTask: false, dailyReward: false };
      }
      
      // Inside handleSave function, after creating updatedCard object
      // Ensure effective dailyReward is used
      updatedCard.dailyReward = goal?.currentSettings?.dailyReward || updatedCard.dailyReward;

      console.log('About to save card with dailyReward:', updatedCard.dailyReward);
      
      console.log('Sending updated card to API:', {
        goalId: goal._id,
        date: updatedCard.date,
        taskCompletions: updatedCard.taskCompletions
      });
      
      // Save to API
      const goalId = goal._id || goal.id;
      
      try {
        const response = await apiService.goals.addOrUpdateDailyCard(goalId, updatedCard);
        console.log('API response:', response);
        
        // Update reward in Zustand store
        if (goal._id && updatedCard.dailyReward) {
          console.log('Updating reward in Zustand after save:', {
            goalId: goal._id,
            reward: updatedCard.dailyReward
          });
          setGoalReward(goal._id, updatedCard.dailyReward);
        }
        
        // Show success message with completed tasks info
        const completedTasksCount = Object.values(safeTaskCompletions).filter(Boolean).length;
        const totalTasksCount = Object.keys(safeTaskCompletions).length;
        
        setSuccess(`Daily progress saved successfully (${completedTasksCount}/${totalTasksCount} tasks completed)`);
        toast.success(`保存成功!`);
        
        // Clear success message after a few seconds
        setTimeout(() => setSuccess(''), 5000);
        
        // Call onSave callback if provided
        if (onSave) {
          console.log('Calling onSave callback with updatedCard data');
          // Pass the locally constructed updatedCard, consistent with handleTaskStatusChange
          onSave(updatedCard); 
        } else {
          console.log('No onSave callback provided');
        }
      } catch (apiError) {
        console.error('API save error:', apiError);
        throw new Error(`API error: ${apiError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save daily card:', error);
      setError(`Failed to save changes: ${error.message || 'Unknown error'}`);
      toast.error(`保存失败: ${error.message || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Effect to check for Zustand rewards when component opens
  useEffect(() => {
    if (open && goal?._id) {
      const zustandReward = getGoalReward(goal._id);
      console.log('DailyCardRecord opened, checking Zustand reward:', {
        goalId: goal._id,
        reward: zustandReward,
        currentSettingsReward: goal?.currentSettings?.dailyReward
      });
      
      if (zustandReward) {
        // Update cardData with the Zustand reward
        setCardData(prev => {
          if (prev.dailyReward !== zustandReward) {
            console.log('Updating cardData with Zustand reward:', zustandReward);
            return {
              ...prev,
              dailyReward: zustandReward
            };
          }
          return prev;
        });
      }
    }
  }, [open, goal?._id, getGoalReward]);

  // 检查主任务是否已完成
  const isMainTaskCompleted = () => {
    // 如果没有主任务，返回true（不阻止奖励领取）
    if (!mainTask) return true;
    
    // 找到主任务并检查其完成状态
    const mainTaskItem = tasksForComponent.find(task => task.isMainTask);
    if (!mainTaskItem) return true;
    
    return cardData.taskCompletions[mainTaskItem.id] || false;
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => {
        // Check if we need to save before closing
        if (hasUserMadeChanges && !isSaving) {
          console.log('DailyCardRecord - Dialog closing with unsaved changes, saving first');
          handleSave().then(() => {
            console.log('DailyCardRecord - Saved changes before closing');
            onClose();
          }).catch(err => {
            console.error('DailyCardRecord - Error saving before close:', err);
            // Still close even if save fails
            onClose();
          });
        } else {
          if (!isSaving) onClose();
        }
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 16
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <IconButton
          edge="start"
          onClick={onClose}
          disabled={isSaving}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2, display: 'flex', alignItems: 'center' }}>
          {isArchived ? `Completed on: ${displayDate}` : displayDate}
          {isArchived && (
            <Chip 
              icon={<ArchiveIcon />} 
              label="Archived" 
              color="secondary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" component="span" sx={{ color: 'text.secondary', mr: 1 }}>
            Goal:
          </Typography>
          <Typography variant="h6" component="div" sx={{ mr: 1 }}>
            {goal?.title || 'Goal'}
          </Typography>
          
          <Tooltip title="View and edit goal declaration">
            <IconButton
              onClick={handleViewDeclaration}
              size="small"
              sx={{ color: '#0D5E6D' }}
            >
              <MenuBookIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pb: 1 }}>
        {isArchived && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This goal has been archived. Progress records are read-only.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {/* Daily Tasks Section */}
        <Box sx={{ my: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Daily Tasks</span>
          </Typography>
          
          {/* Task List */}
          {tasksForComponent.length > 0 ? (
            <List>
              {tasksForComponent.map((task) => (
                <ListItem key={task.id} sx={{ p: 0, my: 1 }}>
                  {editingTaskId === task.id ? (
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        size="small"
                        autoFocus
                      />
                      <IconButton 
                        color="primary" 
                        onClick={() => handleSaveTaskEdit(task.id, task.index)}
                        disabled={isSaving}
                        sx={{ color: '#0D5E6D' }}
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton 
                        color="default" 
                        onClick={handleCancelTaskEdit}
                        disabled={isSaving}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Checkbox
                        checked={task.completed}
                        onChange={(e) => handleTaskStatusChange(task.id, e.target.checked)}
                        sx={{ 
                          color: 'rgba(0, 0, 0, 0.54)',
                          '&.Mui-checked': {
                            color: '#0D5E6D',
                          },
                        }}
                        disabled={isSaving || isArchived}
                      />
                      <Typography 
                        sx={{ 
                          flex: 1,
                          color: task.completed ? 'success.main' : 'text.primary',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          ...(task.isMainTask && {
                            fontWeight: 600,
                            color: task.completed ? 'success.main' : '#0D5E6D'
                          })
                        }}
                      >
                        {task.text || (task.isMainTask && 'No main task set')}
                        {task.isMainTask && (
                          <>
                            <span style={{
                              backgroundColor: 'rgba(255, 127, 102, 0.2)',
                              color: '#FF7F66',
                              border: '1px solid rgba(255, 127, 102, 0.5)',
                              borderRadius: '12px',
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              marginLeft: '8px'
                            }}>
                              main task
                            </span>
                            {!task.text && (
                              <span style={{
                                fontSize: '0.75rem',
                                fontStyle: 'italic',
                                marginLeft: '8px',
                                color: 'rgba(0, 0, 0, 0.6)'
                              }}>
                                (Set in declaration)
                              </span>
                            )}
                          </>
                        )}
                      </Typography>
                      {!task.isLegacy && !task.isMainTask && (
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleInitiateTaskEdit(task.id, task.text)}
                            disabled={isSaving || isArchived}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleInitiateTaskDelete(task.id, task.index)}
                            disabled={isSaving || isArchived}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      {task.isMainTask && (
                        <Tooltip 
                          title="Edit main task in declaration" 
                          arrow
                          componentsProps={{
                            tooltip: {
                              sx: {
                                fontSize: '0.75rem',
                                padding: '8px 12px',
                                backgroundColor: 'rgba(13, 94, 109, 0.9)'
                              }
                            }
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={handleViewDeclaration}
                            disabled={isSaving || isArchived}
                            sx={{ color: '#0D5E6D' }}
                          >
                            <MenuBookIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
              No daily tasks set for this goal.
            </Typography>
          )}
          
          {/* Add New Task Input */}
          <Box sx={{ display: 'flex', mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a new daily task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              disabled={isSaving || isArchived}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      onClick={handleAddTask}
                      disabled={!newTaskText.trim() || isSaving || isArchived}
                      sx={{ color: '#0D5E6D' }}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Rewards Section */}
        <Box sx={{ my: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Rewards</span>
          </Typography>
          
          {/* Always prioritize reward from Zustand store */}
          <DailyReward 
            reward={goal?._id ? (getGoalReward(goal._id) || cardData.dailyReward || 'No reward set') : (cardData.dailyReward || 'No reward set')}
            claimed={cardData.completed?.dailyReward || false}
            onClaimedChange={handleRewardStatusChange}
            disabled={!isMainTaskCompleted() || isArchived}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Progress Records Section */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Today's Progress:
          </Typography>
          
          {/* Existing Records */}
          {Array.isArray(cardData.records) && cardData.records.length > 0 ? (
            <Paper variant="outlined" sx={{ mb: 2, maxHeight: '200px', overflow: 'auto' }}>
              <List dense>
                {cardData.records.map((record, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={record.content}
                      secondary={new Date(record.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleInitiateDelete(index)} disabled={isArchived}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              No progress records yet. Add your first record below.
            </Typography>
          )}
          
          {/* New Record Input */}
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              variant="outlined"
                    placeholder="Enter new record, press Enter to submit..."
                    value={newRecord}
                    onChange={(e) => setNewRecord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRecord(e)}
                    disabled={isSaving || isArchived}
              helperText="Suggested format: Spent [time] [activity] — [insight/result]"
              sx={{ mb: 2 }}
                  />
                  <Button 
              variant="contained" 
              onClick={handleAddRecord}
              sx={{ 
                ml: 1,
                backgroundColor: '#0D5E6D',
                '&:hover': { 
                  backgroundColor: '#0a4a56' 
                }
              }}
              disabled={!newRecord.trim() || isSaving || isArchived}
            >
              {isSaving ? <CircularProgress size={20} /> : 'Add'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
          variant="contained"
          onClick={handleSave} 
          disabled={isSaving || isArchived}
          startIcon={isSaving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{ 
            backgroundColor: '#0D5E6D', 
            '&:hover': { 
              backgroundColor: '#0a4a56' 
            } 
          }}
              >
          {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
      </DialogActions>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      {/* Delete Task Confirmation Dialog */}
      <Dialog
        open={taskDeleteConfirmOpen}
        onClose={handleCancelTaskDelete}
        aria-labelledby="delete-task-dialog-title"
        PaperProps={{
          elevation: 16
        }}
      >
        <DialogTitle id="delete-task-dialog-title">
          Delete Daily Task
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this daily task? 
            <br />
            It will be removed permanently.
          </DialogContentText>
      </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelTaskDelete} sx={{ color: '#0D5E6D' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmTaskDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          elevation: 16
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Delete Progress Record
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this progress record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} sx={{ color: '#0D5E6D' }}>
                Cancel
              </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
                Delete
              </Button>
        </DialogActions>
        </Dialog>
    </Dialog>
  );
}
