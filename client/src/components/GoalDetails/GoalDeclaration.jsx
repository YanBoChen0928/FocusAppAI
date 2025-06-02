import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent,
  IconButton, 
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Fade,
  TextField,
  Input,
  DialogActions,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlagIcon from '@mui/icons-material/Flag';
import TodayIcon from '@mui/icons-material/Today';
import styles from './GoalDeclaration.module.css';
import apiService from '../../services/api';
import { useUserStore } from '../../store/userStore';
import useRewardsStore from '../../store/rewardsStore';
import useMainTaskStore from '../../store/mainTaskStore';
import { ThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Editable field component - allows direct text editing
 */
const EditableField = ({ value, onChange, multiline = false }) => {
  const [fieldValue, setFieldValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (e) => {
    setFieldValue(e.target.value);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    onChange(fieldValue);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.target.blur();
    }
  };
  
  return (
    <span className={`${styles.editableField} ${isFocused ? styles.editing : ''}`}>
      {multiline ? (
        <textarea
          value={fieldValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className={styles.editInput}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={fieldValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          className={styles.editInput}
        />
      )}
    </span>
  );
};

// create a custom theme for GoalDeclaration component
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
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
  ],
  palette: {
    primary: {
      main: '#0D5E6D', // use the green color as the primary color
      light: '#4CD7D0',
      dark: '#0a4a56',
      contrastText: '#fff',
    },
  },
});

/**
 * GoalDeclaration - Goal declaration component
 * Display and edit user's goal declaration
 * 
 * @param {Object} props 
 * @param {Object} props.goal - Goal object
 * @param {boolean} props.isOpen - Whether to display the dialog
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSave - Save callback
 * @param {Function} props.onViewTodayCard - Callback to view today's card
 */
export default function GoalDeclaration({ 
  goal, 
  isOpen, 
  onClose, 
  onSave,
  onViewTodayCard
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedData, setEditedData] = useState({
    title: '',
    motivation: '',
    resources: '',
    nextStep: '',
    dailyTask: '',
    dailyReward: '',
    ultimateReward: '',
    targetDate: null,
    visionImage: null
  });
  
  // State to store updated username info
  const [freshUserInfo, setFreshUserInfo] = useState(null);
  
  // Get the setDeclarationReward function from the Zustand store
  const setDeclarationReward = useRewardsStore(state => state.setDeclarationReward);
  
  // Get the setMainTask function from the Zustand store
  const setMainTask = useMainTaskStore(state => state.setMainTask);
  
  // When dialog opens, fetch fresh user data
  useEffect(() => {
    if (isOpen && goal) {
      // Try to fetch updated user data directly from backend if possible
      const fetchUserInfo = async () => {
        try {
          // If we have apiService available
          if (apiService?.users?.getProfile) {
            console.log("Fetching updated user profile for declaration");
            const response = await apiService.users.getProfile();
            if (response.data && response.data.success) {
              console.log("Got fresh user data:", response.data.data.username);
              setFreshUserInfo(response.data.data);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile for declaration:", error);
          // Silently fail - we'll use other methods to get username
        }
      };
      
      fetchUserInfo();
    }
  }, [isOpen, goal]);
  
  // When goal data changes, update the editing data
  useEffect(() => {
    try {
      if (goal) {
        console.log("GoalDeclaration component received new goal data:", {
          id: goal._id || goal.id,
          title: goal.title,
          hasDeclaration: !!goal.declaration,
          declarationContent: goal.declaration ? (goal.declaration.content ? `${goal.declaration.content.substring(0, 30)}...` : 'Empty content') : 'No declaration object',
          updatedAt: goal.declaration ? goal.declaration.updatedAt : 'No update time'
        });
        
        // Detailed logging of the current declaration status
        console.log("Current declaration object structure:", {
          exists: !!goal.declaration,
          type: goal.declaration ? typeof goal.declaration : 'undefined',
          hasContent: goal.declaration ? !!goal.declaration.content : false,
          contentType: goal.declaration && goal.declaration.content ? typeof goal.declaration.content : 'undefined',
          contentLength: goal.declaration && goal.declaration.content ? goal.declaration.content.length : 0
        });
        
        // If the declaration object exists and has content, reset to view mode
        if (goal.declaration && goal.declaration.content) {
          console.log("Declaration content detected, setting to view mode");
          setIsEditing(false);
        }
        
        // Try to extract variables from declaration content if it exists
        let extractedVariables = {};
        if (goal.declaration?.content) {
          extractedVariables = extractVariablesFromDeclaration(goal.declaration.content);
          console.log("Extracted variables from declaration:", extractedVariables);
        }
        
        // Get data from the goal object for edit mode, with fallbacks to extracted variables
        setEditedData({
          title: goal.title || extractedVariables.title || '',
          motivation: goal.details?.motivation || extractedVariables.motivation || '',
          resources: goal.details?.resources || extractedVariables.resources || '',
          nextStep: goal.details?.nextStep || extractedVariables.nextStep || '',
          dailyTask: goal.currentSettings?.dailyTask || extractedVariables.dailyTask || '',
          dailyReward: goal.currentSettings?.dailyReward || extractedVariables.dailyReward || '',
          ultimateReward: goal.details?.ultimateReward || extractedVariables.ultimateReward || '',
          targetDate: goal.targetDate ? new Date(goal.targetDate) : new Date(),
          visionImage: goal.details?.visionImage || goal.visionImageUrl || null
        });
      }
    } catch (error) {
      console.error("Failed to update editing data:", error);
      // Set safe default values
      setEditedData({
        title: goal?.title || '',
        motivation: '',
        resources: '',
        nextStep: '',
        dailyTask: '',
        dailyReward: '',
        ultimateReward: '',
        targetDate: new Date(),
        visionImage: null
      });
    }
  }, [goal, isOpen]);
  
  // Extract variables from declaration content
  const extractVariablesFromDeclaration = (content) => {
    if (!content || typeof content !== 'string') {
      return {};
    }
    
    try {
      const variables = {};
      
      // Extract title (usually the first line)
      const lines = content.split('\n');
      if (lines.length > 0 && lines[0].trim()) {
        variables.title = lines[0].trim();
      }
      
      // Extract other variables using regex patterns
      const patterns = [
        { name: 'motivation', regex: /stepping onto this path because (.*?)(?:\.|\n)/s, group: 1 },
        { name: 'resources', regex: /I (?:already )?hold (.*?) in my hands/s, group: 1 },
        { name: 'nextStep', regex: /Next, I'll (.*?)(?:,|\n)/s, group: 1 },
        { name: 'dailyTask', regex: /I commit to (.*?) each day/s, group: 1 },
        { name: 'dailyReward', regex: /something small and meaningful: (.*?)(?:\.|\n)/s, group: 1 },
        { name: 'ultimateReward', regex: /treating myself to (.*?)(?:,|\n)/s, group: 1 }
      ];
      
      patterns.forEach(pattern => {
        const match = content.match(pattern.regex);
        if (match && match[pattern.group]) {
          variables[pattern.name] = match[pattern.group].trim();
        }
      });
      
      return variables;
    } catch (error) {
      console.error("Failed to extract variables from declaration:", error);
      return {};
    }
  };
  
  // Handle field updates
  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Get username from the most reliable source available
  const getUsernameFromTempOrUser = () => {
    try {
      // First try to get from Zustand store (if imported)
      if (useUserStore) {
        const storeUser = useUserStore.getState().user;
        if (storeUser && storeUser.username) {
          console.log("Using username from Zustand store:", storeUser.username);
          return storeUser.username;
        }
      }
      
      // Then check if we have fresh user data from direct API call
      if (freshUserInfo && freshUserInfo.username) {
        console.log("Using freshly fetched username:", freshUserInfo.username);
        return freshUserInfo.username;
      }
      
      // Try to get from the centralized user system
      const cachedUser = apiService.userEvents.getCurrentUser();
      if (cachedUser && cachedUser.username) {
        console.log("Using username from centralized user cache:", cachedUser.username);
        return cachedUser.username;
      }
      
      // Check if goal has populated user data (most reliable for registered users)
      if (goal?.user?.username) {
        console.log("Using username from goal.user:", goal.user.username);
        return goal.user.username;
      }
      
      // Check localStorage for authenticated user data
      const storedUsername = localStorage.getItem('username');
      if (storedUsername && storedUsername !== 'User') {
        console.log("Using username from localStorage:", storedUsername);
        return storedUsername;
      }
      
      // Check if this is a temporary user
      const tempId = localStorage.getItem('tempId');
      const isTempUser = tempId || (goal?.userId && typeof goal.userId === 'string' && goal.userId.startsWith('temp_'));
      
      if (isTempUser) {
        console.log("User is a Guest");
        return 'Guest';
      }
      
      // Default fallback
      console.log("No reliable username found, using default");
      return 'User';
    } catch (e) {
      console.error("Error in getUsernameFromTempOrUser:", e);
      return 'User';
    }
  };
  
  // Listen for profile updates so we can refresh username when needed
  useEffect(() => {
    // Listener function for user profile updates
    const handleUserUpdate = (userData) => {
      console.log("GoalDeclaration received user update:", userData.username);
      setFreshUserInfo(userData);
    };
    
    // Subscribe to centralized user profile updates
    const unsubscribe = apiService.userEvents.subscribe(
      'goal-declaration-component',
      handleUserUpdate
    );
    
    // Also listen for direct DOM events as fallback
    const handleDomEvent = (event) => {
      if (event.detail) {
        handleUserUpdate(event.detail);
      }
    };
    
    window.addEventListener('userProfileUpdated', handleDomEvent);
    
    return () => {
      unsubscribe();
      window.removeEventListener('userProfileUpdated', handleDomEvent);
    };
  }, []);
  
  // State to force re-render when username changes
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Generate declaration text
  const generateDeclarationText = (data) => {
    const {
      title,
      motivation,
      resources,
      nextStep,
      dailyTask,
      dailyReward,
      ultimateReward,
      targetDate,
    } = data;
    
    console.log("Generating declaration with motivation:", motivation);
    
    // Get fresh username when generating declaration
    const username = getUsernameFromTempOrUser();
    console.log("Using username for declaration:", username);
    
    const formattedDate = targetDate ? new Date(targetDate).toLocaleDateString() : '';
    
    return `${title}

This goal isn't just another item on my list—it's something I genuinely want to achieve

I'm ${username}, and I'm stepping onto this path because ${motivation}. It's something deeply meaningful to me, a desire that comes straight from my heart.

I trust that I have what it takes, because I already hold ${resources} in my hands—these are my sources of confidence and strength as I move forward.

I don't need to wait until I'm "fully ready." The best moment to start is right now. Next, I'll ${nextStep}, beginning with this first step and letting the momentum carry me onward.

I understand that as long as I commit to ${dailyTask} each day, little by little, I'll steadily move closer to the goal I'm eager to achieve.

Every time I complete my daily milestone, I'll reward myself with something small and meaningful: ${dailyReward}. When I fully accomplish my goal, I'll celebrate this journey by treating myself to ${ultimateReward}, as recognition for what I've achieved.

I've set a deadline for myself: ${formattedDate}. I know there might be ups and downs along the way, but I deeply believe I have enough resources and strength to keep going.

Because the path is already beneath my feet—it's really not that complicated. All I need to do is stay focused and adjust my pace when needed ^^.`;
  };
  
  // Format declaration content, highlighting variables
  const formatDeclarationContent = (content) => {
    if (!content) {
      console.log("Warning: Declaration content is empty, will use default template");
      // This won't be reached because we provide a default content in rendering
      return (
        <Box className={styles.emptyState}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your goal doesn't have complete declaration content yet.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setIsEditing(true)}
            startIcon={<EditIcon />}
          >
            Edit Goal Declaration
          </Button>
        </Box>
      );
    }
    
    // Safety check: ensure content is a string
    if (typeof content !== 'string') {
      console.error("Declaration content is not a string:", content);
      try {
        content = String(content);
      } catch (e) {
        console.error("Cannot convert declaration content to string:", e);
        return (
          <Box className={styles.emptyState}>
            <Typography variant="body1" color="error">
              Invalid declaration content format. Please click edit button to recreate.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setIsEditing(true)}
              startIcon={<EditIcon />}
              sx={{ mt: 2 }}
            >
              Edit Declaration
            </Button>
          </Box>
        );
      }
    }
    
    console.log("Processing declaration content formatting:", {
      contentLength: content.length,
      contentFirstChars: content.substring(0, 30) + '...'
    });
    
    // Get fresh username when formatting declaration
    const username = getUsernameFromTempOrUser();
    console.log("Using username for content display:", username);
    
    // Enhanced user name replacement - handle all possible variations
    // Replace all possible variations of "I'm X" with the correct username
    const userPattern = /I'm\s+(.*?),\s+and\s+I'm\s+stepping/g;
    if (userPattern.test(content)) {
      content = content.replace(userPattern, `I'm ${username}, and I'm stepping`);
      console.log("Replaced any existing username pattern with:", username);
    } else if (content.includes("I'm") && content.includes("stepping onto this path")) {
      // If pattern isn't exact but contains relevant parts, try more general replacement
      content = content.replace(/I'm\s+[^,\n]+/, `I'm ${username}`);
      console.log("Replaced partial username match with:", username);
    }
    
    // Also handle specific cases that might have been set before
    if (content.includes("I'm User")) {
      content = content.replace(/I'm User/g, `I'm ${username}`);
      console.log("Replaced 'I'm User' with:", username);
    }
    
    if (content.includes("I'm Guest") && username !== 'Guest') {
      content = content.replace(/I'm Guest/g, `I'm ${username}`);
      console.log("Replaced 'I'm Guest' with actual username:", username);
    }
    
    if (username === 'Guest' && !content.includes("I'm Guest")) {
      // For Guest users, ensure username shows as Guest
      content = content.replace(/I'm\s+[^,\n]+/, `I'm Guest`);
      console.log("Forced 'I'm Guest' for Guest user");
    }
    
    try {
      // Process declaration content in paragraphs (only if content is long enough)
      if (content.length < 10) {
        console.warn("Declaration content too short, not processing paragraphs:", content);
        return (
          <Typography className={styles.paragraph} variant="body1">
            {content}
            <Button 
              variant="text" 
              color="primary" 
              onClick={() => setIsEditing(true)}
              startIcon={<EditIcon />}
              size="small"
              sx={{ ml: 2 }}
            >
              Improve Declaration
            </Button>
          </Typography>
        );
      }
      
      // Use regex to safely split paragraphs, avoiding rendering errors due to formatting issues
      const paragraphs = content.split(/\n\s*\n|\n{2,}/);
      
      if (paragraphs.length === 0) {
        console.warn("No content after splitting, using original content:", content);
        return (
          <Typography className={styles.paragraph} variant="body1">
            {content}
          </Typography>
        );
      }
      
      // Check for title
      let title = null;
      let contentParagraphs = [...paragraphs];
      
      // If first paragraph is a title (short and no periods)
      if (paragraphs[0].length < 100 && !paragraphs[0].includes('.')) {
        title = paragraphs[0];
        contentParagraphs = paragraphs.slice(1);
      }
      
      return (
        <>
          {title && (
            <Typography variant="h4" className={styles.title}>
              {title}
            </Typography>
          )}
          
          {contentParagraphs.map((paragraph, index) => {
            // Skip empty paragraphs
            if (!paragraph.trim()) return null;
            
            // Check if paragraph contains variables
            let formattedParagraph = paragraph;
            
            // Process possible variable fields
            const variablePatterns = [
              // Detect patterns for variables using regex
              { regex: /stepping onto this path because ([^.]+)/, group: 1 }, // motivation
              { regex: /I already hold ([^.]+) in my hands/, group: 1 }, // resources
              { regex: /Next, I'll ([^,]+)/, group: 1 }, // nextStep
              { regex: /I commit to ([^.]+) each day/, group: 1 }, // dailyTask
              { regex: /something small and meaningful: ([^.]+)/, group: 1 }, // dailyReward
              { regex: /treating myself to ([^,]+)/, group: 1 }, // ultimateReward
              { regex: /deadline for myself: ([^.]+)/, group: 1 }, // targetDate
              // 添加更多模式匹配
              { regex: /(picuture is beautiful|great)/i, group: 1 }, // 匹配特定单词
              { regex: /(take my first step and let the momentum carry me onward)/i, group: 1 }, // 匹配短语
              { regex: /(daily persistence)/i, group: 1 }, // 匹配短语
              { regex: /(appropriate reward)/i, group: 1 }, // 匹配短语
              { regex: /([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}|[0-9]{4}-[0-9]{1,2}-[0-9]{1,2})/, group: 1 } // 匹配日期格式
            ];
            
            // Apply variable detection and style replacement
            try {
              variablePatterns.forEach(pattern => {
                const match = formattedParagraph.match(pattern.regex);
                if (match && match[pattern.group]) {
                  const variable = match[pattern.group];
                  formattedParagraph = formattedParagraph.replace(
                    match[0],
                    match[0].replace(
                      variable,
                      `<span class="${styles.variableValue}">${variable}</span>`
                    )
                  );
                }
              });
            } catch (regexError) {
              console.error("Regex processing for variables failed:", regexError);
              // Continue with original paragraph if regex fails
            }
            
            // If it contains variables, use dangerouslySetInnerHTML to display
            if (formattedParagraph !== paragraph) {
              return (
                <Typography 
                  key={index} 
                  className={styles.paragraph} 
                  variant="body1"
                  dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                />
              );
            }
            
            // Otherwise display normally
            return (
              <Typography key={index} className={styles.paragraph} variant="body1">
                {paragraph}
              </Typography>
            );
          })}
        </>
      );
    } catch (error) {
      console.error("Failed to format declaration content:", error, "Original content:", content);
      // If paragraph processing fails, at least show original content
      return (
        <>
          <Typography className={styles.paragraph} variant="body1" color="error">
            Problem displaying declaration content.
          </Typography>
          <Typography className={styles.paragraph} variant="body1">
            {String(content)}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setIsEditing(true)}
            startIcon={<EditIcon />}
            sx={{ mt: 2 }}
          >
            Re-edit Declaration
          </Button>
        </>
      );
    }
  };
  
  // Render editable declaration
  const renderEditableDeclaration = () => {
    if (!goal) {
      return (
        <Box className={styles.emptyState}>
          <Typography variant="body1">
            Unable to load goal data, please try again later.
          </Typography>
        </Box>
      );
    }
    
    const username = getUsernameFromTempOrUser();

    return (
      <div className={styles.declaration}>
        <Typography variant="h4" className={styles.title}>
          <EditableField 
            value={editedData.title} 
            onChange={(value) => handleFieldChange('title', value)} 
          />
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          This goal isn't just another item on my list—it's something I genuinely want to achieve.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          I'm {username}, and I'm stepping onto this path because{' '}
          <EditableField 
            value={editedData.motivation} 
            onChange={(value) => handleFieldChange('motivation', value)}
            multiline 
          />
          {'. '}It's something deeply meaningful to me, a desire that comes straight from my heart.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          I trust that I have what it takes, because I already hold{' '}
          <EditableField 
            value={editedData.resources} 
            onChange={(value) => handleFieldChange('resources', value)}
            multiline 
          />
          {' '}in my hands—these are my sources of confidence and strength as I move forward.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          I don't need to wait until I'm "fully ready." The best moment to start is right now. Next, I'll{' '}
          <EditableField 
            value={editedData.nextStep} 
            onChange={(value) => handleFieldChange('nextStep', value)}
          />
          {', '}beginning with this first step and letting the momentum carry me onward.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          I understand that as long as I commit to{' '}
          <EditableField 
            value={editedData.dailyTask} 
            onChange={(value) => handleFieldChange('dailyTask', value)}
          />
          {' '}each day, little by little, I'll steadily move closer to the goal I'm eager to achieve.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          Every time I complete my daily milestone, I'll reward myself with something small and meaningful:{' '}
          <EditableField 
            value={editedData.dailyReward} 
            onChange={(value) => handleFieldChange('dailyReward', value)}
          />
          {'. '}When I fully accomplish my goal, I'll celebrate this journey by treating myself to{' '}
          <EditableField 
            value={editedData.ultimateReward} 
            onChange={(value) => handleFieldChange('ultimateReward', value)}
          />
          {', '}as recognition for what I've achieved.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          I've set a deadline for myself: {new Date(editedData.targetDate).toLocaleDateString()}. I know there might be ups and downs along the way, but I deeply believe I have enough resources and strength to keep going.
        </Typography>
        
        <Typography className={styles.paragraph} variant="body1">
          Because the path is already beneath my feet—it's really not that complicated. All I need to do is stay focused and adjust my pace when needed ^^.
        </Typography>
      </div>
    );
  };
  
  // Save declaration
  const handleSave = async () => {
    if (!goal) {
      setError('Save failed: Unable to get goal data');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      console.log("Starting preparation of declaration data...");
      console.log("Using motivation value:", editedData.motivation);
      console.log("Current goal object:", {
        id: goal._id || goal.id,
        hasId: !!(goal._id || goal.id),
        type: typeof goal,
        keys: Object.keys(goal)
      });
      
      // Prepare update data
      const updatedGoal = {
        title: editedData.title,
        // Set motivation as a top-level property for immediate access
        motivation: editedData.motivation,
        details: {
          ...(goal.details || {}),
          motivation: editedData.motivation,
          resources: editedData.resources,
          nextStep: editedData.nextStep,
          ultimateReward: editedData.ultimateReward,
          visionImage: editedData.visionImage
        },
        visionImageUrl: editedData.visionImage || goal.visionImageUrl,
        currentSettings: {
          ...(goal.currentSettings || {}),
          dailyTask: editedData.dailyTask,
          dailyReward: editedData.dailyReward,
        },
        targetDate: editedData.targetDate,
        declaration: {
          content: generateDeclarationText(editedData),
          updatedAt: new Date()
        }
      };
      
      // Ensure valid goal ID
      let goalId = goal._id || goal.id;
      
      // Additional check: If no direct _id or id property, try to get from other possible places
      if (!goalId && goal) {
        console.log("Cannot get ID directly from goal object, trying deeper search...");
        // Check if ID is included in other goal properties
        if (goal.goalId) {
          goalId = goal.goalId;
          console.log("Found ID from goal.goalId:", goalId);
        } else if (goal._doc && (goal._doc._id || goal._doc.id)) {
          // MongoDB sometimes puts the document in _doc property
          goalId = goal._doc._id || goal._doc.id;
          console.log("Found ID from goal._doc:", goalId);
        }
      }
      
      if (!goalId) {
        console.error("Save failed: Cannot find valid goal ID", goal);
        throw new Error('Invalid goal ID');
      }
      
      console.log("Found valid goal ID:", goalId);
      console.log("Preparing to save declaration content:", {
        content: updatedGoal.declaration.content.substring(0, 100) + "...",
        length: updatedGoal.declaration.content.length
      });
      
      try {
        console.log("Calling API to save declaration data...");
        const result = await onSave(goalId, updatedGoal);
        
        console.log("Declaration saved successfully, API result:", result);
        
        // Update the declaration reward in the Zustand store
        if (goalId && editedData.dailyReward) {
          console.log("Updating declaration reward in Zustand store:", {
            goalId,
            reward: editedData.dailyReward
          });
          setDeclarationReward(goalId, editedData.dailyReward);
        }
        
        // Update the main task in the Zustand store
        if (goalId && editedData.dailyTask) {
          console.log("Updating main task in Zustand store:", {
            goalId,
            dailyTask: editedData.dailyTask
          });
          setMainTask(goalId, editedData.dailyTask);
        }
        
        // Create a more complete localUpdatedGoal with consistent motivation across all fields
        const localUpdatedGoal = {
          ...goal,
          _id: goalId, // Ensure ID remains consistent
          id: goalId,  // Update both possible ID formats
          title: editedData.title,
          declaration: {
            content: updatedGoal.declaration.content,
            updatedAt: new Date()
          },
          // Ensure motivation is available in ALL places it might be accessed from
          motivation: editedData.motivation,
          description: editedData.motivation, // Add to description as fallback
          details: {
            ...(goal.details || {}),
            motivation: editedData.motivation, // Ensure details.motivation is set
            resources: editedData.resources,
            nextStep: editedData.nextStep,
            ultimateReward: editedData.ultimateReward,
            visionImage: editedData.visionImage
          },
          visionImageUrl: editedData.visionImage || goal.visionImageUrl,
          currentSettings: {
            ...(goal.currentSettings || {}),
            dailyTask: editedData.dailyTask,
            dailyReward: editedData.dailyReward
          },
          // Add rewards array with dailyReward to ensure it gets passed properly
          rewards: Array.isArray(goal.rewards) 
            ? [...goal.rewards.filter(r => r !== editedData.dailyReward), editedData.dailyReward]
            : [editedData.dailyReward]
        };
        
        console.log("Local updated goal with motivation:", {
          motivation: localUpdatedGoal.motivation,
          detailsMotivation: localUpdatedGoal.details?.motivation,
          description: localUpdatedGoal.description
        });
        
        // Make sure rewards include the dailyReward value for DailyCardRecord
        console.log("Updated rewards array:", {
          dailyReward: editedData.dailyReward,
          rewards: localUpdatedGoal.rewards
        });
        
        // Ensure the goal object is completely updated (more thoroughly)
        for (const key in localUpdatedGoal) {
          if (localUpdatedGoal.hasOwnProperty(key)) {
            goal[key] = localUpdatedGoal[key];
          }
        }
        
        // Exit edit mode
        setIsEditing(false);
        
        // Show success message
        setSuccess('Goal declaration successfully updated');
        
        // First make sure motivation is directly accessible on the goal
        if (goal && typeof goal === 'object') {
          // Double-check that motivation is set on the goal object
          goal.motivation = editedData.motivation;
          if (goal.details) goal.details.motivation = editedData.motivation;
        }
        
        // Signal parent component to update immediately without closing the dialog
        if (onClose) {
          // Pass a clean copy of the local goal to prevent reference issues
          const cleanCopy = JSON.parse(JSON.stringify(localUpdatedGoal));
          console.log("Sending updated goal to parent with motivation:", cleanCopy.motivation);
          console.log("Sending updated goal with dailyReward:", cleanCopy.currentSettings?.dailyReward);
          console.log("Sending updated rewards array:", cleanCopy.rewards);
          onClose(cleanCopy, false); // Pass updated goal and false for "don't close dialog"
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (saveError) {
        console.error('API call failed:', saveError);
        throw saveError;
      }
    } catch (err) {
      console.error('Failed to save declaration:', err);
      setError(`Save failed: ${err.message || 'Please try again later'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <ThemeProvider theme={defaultTheme}>
      <Dialog
        open={isOpen}
        onClose={() => !isSaving && onClose(null, true)}
        maxWidth="md"
        fullWidth
        className={styles.declarationDialog}
        sx={{ 
          '& .MuiDialog-paper': { 
            maxHeight: '90vh',
            // Make sure dialog is visible to html2canvas even if it's normally hidden
            '&.MuiDialog-paper': {
              visibility: 'visible !important',
              position: 'absolute !important',
              zIndex: 1000
            }
          } 
        }}
      >
        <DialogContent className={styles.dialogContent}>
          {/* Header buttons */}
          <div className={styles.header}>
            <Tooltip 
              title="Back to main page" 
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
              <IconButton className={styles.closeButton} onClick={() => !isSaving && onClose(null, true)} disabled={isSaving}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
            
            {onViewTodayCard && (
              <Tooltip 
                title="View today's card" 
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
                <IconButton 
                  className={styles.todayButton} 
                  onClick={() => {
                    onViewTodayCard(goal);
                    onClose(null, true);
                  }} 
                  disabled={isSaving}
                >
                  <TodayIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {!isEditing && (
              <Tooltip 
                title="Edit declaration" 
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
                <IconButton 
                  className={styles.editButton} 
                  onClick={() => setIsEditing(true)} 
                  disabled={isSaving}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {isEditing && (
              <>
                <Tooltip 
                  title="Cancel changes" 
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
                  <IconButton 
                    className={styles.cancelButton} 
                    onClick={() => setIsEditing(false)} 
                    disabled={isSaving}
                  >
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip 
                  title="Save declaration" 
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
                  <IconButton 
                    className={styles.saveButton} 
                    onClick={handleSave} 
                    disabled={isSaving}
                    sx={{ color: '#0D5E6D' }}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </div>
          
          {/* Declaration icon */}
          <div className={styles.declarationIcon}>
            <EmojiEventsIcon className={styles.bookIcon} />
          </div>
          
          {/* Error alert */}
          {error && (
            <Alert severity="error" className={styles.alert}>
              {error}
            </Alert>
          )}
          
          {/* Success alert */}
          {success && (
            <Fade in={!!success}>
              <Alert severity="success" className={styles.alert}>
                {success}
              </Alert>
            </Fade>
          )}
          
          {/* Loading indicator */}
          {isSaving && (
            <Box className={styles.loadingContainer}>
              <CircularProgress size={24} />
              <Typography variant="body2" className={styles.loadingText}>
                Saving...
              </Typography>
            </Box>
          )}
          
          {/* Declaration content - Fixed DOM structure */}
          <div className={styles.contentContainer} data-export-id="goal-declaration-content">
            {!goal ? (
              <Box className={styles.emptyState}>
                <Typography variant="body1">
                  Unable to load goal data. Please close and try again.
                </Typography>
              </Box>
            ) : isEditing ? (
              renderEditableDeclaration()
            ) : (
              // Modified rendering logic to ensure content is always displayed, even if empty
              formatDeclarationContent(goal.declaration?.content || (() => {
                // 使用优化后的函数获取用户名
                const username = getUsernameFromTempOrUser();
                console.log("Using username for default content:", username);
                
                return `# ${goal.title || 'My Goal'}

This goal isn't just another item on my list—it's something I genuinely want to achieve.

I'm ${username}, and I'm stepping onto this path because this is a deeply meaningful pursuit to me, a desire that comes straight from my heart.

I trust that I have what it takes, because I already have the preparation I need. These are my sources of confidence and strength.

I don't need to wait until I'm "fully ready." The best moment to start is right now. Next, I'll take my first step and let the momentum carry me forward.

I understand that as long as I commit to consistent progress each day, little by little, I'll steadily move closer to the goal I'm eager to achieve.`;
              })())
            )}
          </div>
          
          {/* Bottom buttons */}
          <Box className={styles.actionButtons}>
            {isEditing && (
              <Button
                variant="contained"
                sx={{ 
                  backgroundColor: '#0D5E6D',
                  '&:hover': {
                    backgroundColor: '#0a4a56'
                  }
                }}
                onClick={handleSave}
                disabled={isSaving}
                startIcon={<CheckCircleIcon />}
              >
                {isSaving ? 'Saving...' : 'Confirm Save'}
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
} 