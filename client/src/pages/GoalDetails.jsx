import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HomeIcon from '@mui/icons-material/Home';
import GoalDetailsComponent from '../components/GoalDetails/GoalDetails';
import apiService from '../services/api';
import styles from '../components/GoalDetails/GoalDetails.module.css';

function GoalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);
  
  // Get current user ID from localStorage
  const getUserId = () => {
    return localStorage.getItem("userId") || localStorage.getItem("tempId");
  };
  
  // Check if we came from search page
  const isFromSearch = location.state?.fromSearch || location.search.includes('fromSearch=true');
  
  // Fetch goal details and prepare data for GoalDetails component
  useEffect(() => {
    const fetchGoalDetails = async () => {
      try {
        setLoading(true);
        // Fetch the specific goal by ID
        const response = await apiService.goals.getById(id);
        const goalData = response.data.data || response.data;
        
        if (!goalData) {
          throw new Error('Goal data not found');
        }
        
        setGoalData(goalData);
        
        // We also need to fetch all goals to pass to the component
        try {
          const userId = getUserId();
          if (userId) {
            const allGoalsResponse = await apiService.goals.getUserGoals(userId);
            const allGoals = allGoalsResponse.data.data || allGoalsResponse.data || [];
            setGoals([...allGoals]);
          }
        } catch (goalsErr) {
          console.error('Error fetching all goals:', goalsErr);
          // Even if we can't get all goals, we can still show the single goal
          setGoals([goalData]);
        }
      } catch (err) {
        console.error('Error fetching goal details:', err);
        setError('Failed to load goal details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchGoalDetails();
    }
  }, [id]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Handle going back to previous page
  const handleGoBack = () => {
    if (isFromSearch) {
      navigate('/search');
    } else {
      navigate('/');
    }
  };
  
  // Handle goal deletion (required by GoalDetails component)
  const handleGoalDeleted = (deletedGoalId) => {
    console.log(`Goal deleted: ${deletedGoalId}`);
    // Navigate back after goal is deleted
    handleGoBack();
  };
  
  // Refresh goal data (required by GoalDetails component)
  const refreshGoalData = async (goalId) => {
    try {
      const response = await apiService.goals.getById(goalId);
      const refreshedGoal = response.data.data || response.data;
      setGoalData(refreshedGoal);
      return refreshedGoal;
    } catch (error) {
      console.error('Error refreshing goal data:', error);
      return null;
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">{error}</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleGoBack}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!goalData) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">Goal not found</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleGoBack}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container>
      <Box pt={4} pb={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Goal Details
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          {/* Use the GoalDetails component with needed props */}
          <GoalDetailsComponent
            goals={goals}
            goalId={id}
            onGoalDeleted={handleGoalDeleted}
            refreshGoalData={refreshGoalData}
            sx={{ width: '100%' }}
          />
        </Paper>
      </Box>
    </Container>
  );
}

export default GoalDetails; 