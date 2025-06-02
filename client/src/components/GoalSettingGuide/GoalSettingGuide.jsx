import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper, Container, CircularProgress } from '@mui/material';
import TitleStep from './TitleStep';
import MotivationStep from './MotivationStep';
import DateStep from './DateStep';
import ResourcesStep from './ResourcesStep';
import RewardsStep from './RewardsStep';
import VisionStep from './VisionStep';

// localStorage key name
const STORAGE_KEY = 'focus_goal_setting_draft';

// Step titles
const steps = [
  'Goal Setting',
  'Motivation Exploration',
  'Date Setting',
  'Resources & Steps',
  'Rewards System',
  'Vision Image'
];

// Initial form data
const initialGoalData = {
  title: '',
  motivation: '',
  targetDate: null,
  resources: [], // Changed to array, can add multiple
  dailyTasks: [], // Changed to array, can add multiple
  rewards: [], // Changed to array, can add multiple
  visionImageUrl: null,
  status: 'active' // Default status
};

/**
 * Goal Setting Guide Component
 * Guides users through 5 steps to complete goal setting
 */
const GoalSettingGuide = ({ onComplete, isSubmitting = false, onCancel }) => {
  // Current step
  const [activeStep, setActiveStep] = useState(0);
  
  // Goal data
  const [goalData, setGoalData] = useState(initialGoalData);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // If there is a date field, convert it to a Date object
        if (parsedData.targetDate) {
          parsedData.targetDate = new Date(parsedData.targetDate);
        }
        setGoalData(parsedData);
        console.log('Form data restored from localStorage');
      }
    } catch (error) {
      console.error('Failed to restore data from localStorage:', error);
    }
  }, []);

  // Validate whether the current step can proceed
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Title step
        return goalData.title.trim() !== '';
      case 1: // Motivation step
        return goalData.motivation.trim() !== '';
      case 2: // Date step
        return goalData.targetDate !== null && goalData.targetDate instanceof Date;
      case 3: // Resources step
        // resources and dailyTasks are optional
        return true;
      case 4: // Rewards step
        // rewards are optional
        return true;
      case 5: // Vision image step
        // Vision image is optional
        return true;
      default:
        return false;
    }
  };

  // Handle data updates
  const handleDataChange = (field, value) => {
    const updatedData = {
      ...goalData,
      [field]: value
    };
    
    setGoalData(updatedData);
    
    // Save to localStorage
    try {
      const dataToSave = {...updatedData};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  };

  // Add multiple items (resources/tasks/rewards)
  const handleAddItem = (field, item) => {
    if (!item.trim()) return;
    
    const items = [...goalData[field], item];
    handleDataChange(field, items);
  };

  // Remove multiple items
  const handleRemoveItem = (field, index) => {
    const items = [...goalData[field]];
    items.splice(index, 1);
    handleDataChange(field, items);
  };

  // Next step
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      console.log("GoalSettingGuide: Final step, preparing to submit...");
      
      // Generate detailed description
      const generatedDescription = `I want to ${goalData.title}, because ${goalData.motivation}.`;
      
      // Generate declaration content
      const generateDeclarationText = (data) => {
        const username = 'User'; // Can be obtained from elsewhere
        const formattedDate = data.targetDate ? new Date(data.targetDate).toLocaleDateString() : '';
        const dailyTask = data.dailyTasks && data.dailyTasks.length > 0 ? data.dailyTasks[0] : 'daily persistence';
        const reward = data.rewards && data.rewards.length > 0 ? data.rewards[0] : 'appropriate reward';
        const resource = data.resources && data.resources.length > 0 ? data.resources[0] : 'necessary preparation';
        
        return `${data.title}

This goal isn't just another item on my list—it's something I genuinely want to achieve.

I'm stepping onto this path because ${data.motivation}. It's something deeply meaningful to me, a desire that comes straight from my heart.

I trust that I have what it takes, because I already have ${resource} in my hands—these are my sources of confidence and strength as I move forward.

I don't need to wait until I'm "fully ready." The best moment to start is right now. Next, I'll take my first step and let the momentum carry me onward.

I understand that as long as I commit to ${dailyTask} each day, little by little, I'll steadily move closer to the goal I'm eager to achieve.

Every time I complete my daily milestone, I'll reward myself with something small and meaningful: ${reward}. 

I've set a deadline for myself: ${formattedDate}. I know there might be ups and downs along the way, but I deeply believe I have enough resources and strength to keep going.

Because the path is already beneath my feet—it's really not that complicated. All I need to do is stay focused and adjust my pace when needed ^^.`;
      };
      
      // Ensure all necessary fields have values
      const finalGoalData = {
        ...goalData,
        description: generatedDescription,
        // Add declaration object
        declaration: {
          content: generateDeclarationText(goalData),
          updatedAt: new Date()
        }
      };
      
      console.log("GoalSettingGuide: Final goal setting data:", {
        title: finalGoalData.title,
        description: finalGoalData.description,
        hasDescription: !!finalGoalData.description,
        descriptionLength: finalGoalData.description ? finalGoalData.description.length : 0,
        hasMotivation: !!finalGoalData.motivation,
        targetDate: finalGoalData.targetDate,
        resourcesCount: finalGoalData.resources.length,
        dailyTasksCount: finalGoalData.dailyTasks.length,
        rewardsCount: finalGoalData.rewards.length,
        hasVisionImage: !!finalGoalData.visionImageUrl,
        // Add declaration log records
        hasDeclaration: !!finalGoalData.declaration,
        declarationLength: finalGoalData.declaration ? finalGoalData.declaration.content.length : 0
      });
      
      try {
        // Submit form
        console.log("GoalSettingGuide: Calling onComplete to submit form...");
        onComplete(finalGoalData);
        
        // Clear data from localStorage
        console.log("GoalSettingGuide: Clearing locally stored form data");
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("GoalSettingGuide: Error submitting form:", error);
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  // Previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle cancel
  const handleCancel = () => {
    // Clear data from localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // Call external cancel handler (if available)
    if (onCancel) {
      onCancel();
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <TitleStep 
            value={goalData.title} 
            onChange={(value) => handleDataChange('title', value)} 
          />
        );
      case 1:
        return (
          <MotivationStep 
            value={goalData.motivation} 
            onChange={(value) => handleDataChange('motivation', value)} 
          />
        );
      case 2:
        return (
          <DateStep 
            value={goalData.targetDate} 
            onChange={(value) => handleDataChange('targetDate', value)} 
          />
        );
      case 3:
        return (
          <ResourcesStep 
            resources={goalData.resources}
            dailyTasks={goalData.dailyTasks}
            onAddResource={(value) => handleAddItem('resources', value)}
            onRemoveResource={(index) => handleRemoveItem('resources', index)}
            onAddDailyTask={(value) => handleAddItem('dailyTasks', value)}
            onRemoveDailyTask={(index) => handleRemoveItem('dailyTasks', index)}
          />
        );
      case 4:
        return (
          <RewardsStep 
            rewards={goalData.rewards}
            onAddReward={(value) => handleAddItem('rewards', value)}
            onRemoveReward={(index) => handleRemoveItem('rewards', index)}
          />
        );
      case 5:
        return (
          <VisionStep 
            value={goalData.visionImageUrl} 
            onChange={(value) => handleDataChange('visionImageUrl', value)} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" align="center" sx={{ flexGrow: 1 }}>
            Goal Setting Guide
          </Typography>
          <Button onClick={handleCancel} color="inherit" size="small">
            Cancel
          </Button>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent()}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || isSubmitting}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            disabled={!validateStep() || isSubmitting}
            onClick={handleNext}
            startIcon={isSubmitting && activeStep === steps.length - 1 ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default GoalSettingGuide; 