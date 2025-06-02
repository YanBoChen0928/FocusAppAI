import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  IconButton,
  Divider,
  InputAdornment,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import apiService from '../services/api';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Form state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('criteria') || '');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Results state
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  
  // Fallback data
  const [allGoals, setAllGoals] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Load search from URL params when component mounts
  useEffect(() => {
    const criteria = searchParams.get('criteria');
    const start = searchParams.get('createdStartDate');
    const end = searchParams.get('createdEndDate');
    
    // Always fetch all goals first
    fetchAllGoals().then(() => {
      // Then perform search if there are criteria
      if (criteria || start || end) {
        if (criteria) setSearchQuery(criteria);
        if (start) setStartDate(new Date(start));
        if (end) setEndDate(new Date(end));
        
        // Wait until we have the goals before searching
        setTimeout(() => handleSearch(criteria, start, end), 100);
      } else {
        // Ensure we don't show all goals when no search criteria exist
        setSearchResults([]);
        setSearched(false);
      }
    });
  }, []);
  
  const fetchAllGoals = async () => {
    try {
      // First try to get user goals API which has complete data
      try {
        const userId = localStorage.getItem("userId") || localStorage.getItem("tempId");
        if (userId) {
          const response = await apiService.goals.getUserGoals(userId);
          if (response.data && response.data.data) {
            const goals = response.data.data || [];
            setAllGoals(goals);
            return;
          }
        }
      } catch (userGoalsError) {
        console.error('Failed to fetch user goals, trying general getAll:', userGoalsError);
      }
      
      // Fallback to getAll method
      const response = await apiService.goals.getAll();
      if (response.data) {
        const goals = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setAllGoals(goals);
      }
    } catch (error) {
      console.error('Failed to fetch all goals as fallback:', error);
      setError('Could not load goals. Please try again later.');
      setShowError(true);
    }
  };
  
  const performLocalSearch = (query, startDateStr, endDateStr) => {
    let filtered = [...allGoals];
    
    // If no search criteria, return all goals
    if (!query && !startDateStr && !endDateStr) {
      return filtered;
    }
    
    // Use OR logic instead of AND - any condition match should return the goal
    return filtered.filter(goal => {
      // Check title match if query exists
      const titleMatch = query ? 
        (goal.title && goal.title.toLowerCase().includes(query.toLowerCase())) : 
        false;
        
      // Check date range if either start or end date exists
      let dateMatch = false;
      const createdAt = goal.createdAt ? new Date(goal.createdAt) : null;
      
      // If we have a created date to check against
      if (createdAt) {
        // Start date check
        const afterStartDate = startDateStr ? 
          (createdAt >= new Date(startDateStr)) : 
          true;
          
        // End date check (set end date to end of day)
        const beforeEndDate = endDateStr ? 
          (() => {
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);
            return createdAt <= endDate;
          })() : 
          true;
          
        // Date matches if it's after start date AND before end date
        dateMatch = afterStartDate && beforeEndDate;
      }
      
      // Return true if EITHER title matches OR date is in range
      // If we have a query, title must match; if we have dates, dates must match
      // This ensures we don't return ALL goals when criteria are specified
      if (query && (startDateStr || endDateStr)) {
        return titleMatch || dateMatch;
      } else if (query) {
        return titleMatch;
      } else if (startDateStr || endDateStr) {
        return dateMatch;
      }
      return false; // Should never reach here due to initial check
    });
  };
  
  const handleSearch = async (query = searchQuery, start = startDate, end = endDate) => {
    // Don't perform search if all criteria are empty
    if (!query && !start && !end) {
      setSearchResults([]);
      setSearched(false);
      setSearchParams({});
      return;
    }
    
    // Update URL with search parameters
    const params = {};
    if (query) params.criteria = query;
    if (start) params.createdStartDate = start instanceof Date ? start.toISOString() : start;
    if (end) params.createdEndDate = end instanceof Date ? end.toISOString() : end;
    setSearchParams(params);
    
    setLoading(true);
    setError(null);
    
    // Skip the API call and directly use local filtering
    setUsingFallback(true);
    
    const startStr = start instanceof Date ? start.toISOString() : start;
    const endStr = end instanceof Date ? end.toISOString() : end;
    
    const filteredResults = performLocalSearch(query, startStr, endStr);
    setSearchResults(filteredResults);
    
    if (filteredResults.length === 0) {
      setError('No matching goals found. Try different search criteria.');
      setShowError(true);
    }
    
    setSearched(true);
    setLoading(false);
  };
  
  const handleClear = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
    setSearchResults([]);
    setSearched(false);
    setSearchParams({});
    setError(null);
    setUsingFallback(false);
  };
  
  const viewGoalDetails = (goalId) => {
    navigate(`/goals/${goalId}?fromSearch=true`, { 
      state: { fromSearch: true } 
    });
  };
  
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };
  
  const handleCloseError = () => {
    setShowError(false);
  };
  
  const navigateToHome = () => {
    navigate('/');
  };
  
  return (
    <Container>
      <Box pt={4} pb={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search Goals
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<HomeIcon />} 
            onClick={navigateToHome}
          >
            Back to Home
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box component="form" noValidate onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Search goals by title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  <strong>Search by Creation Date Range:</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Find goals created between specific dates or with matching titles
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Created After (Start Date)"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: "Search goals created on or after this date"
                      }
                    }}
                    format="MM/dd/yyyy"
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Created Before (End Date)"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: "Search goals created on or before this date"
                      }
                    }}
                    format="MM/dd/yyyy"
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <Button 
                  variant="contained" 
                  type="submit"
                  startIcon={<SearchIcon />}
                  disabled={loading}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        {usingFallback && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Using client-side filtering. Some search features may be limited.
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && searched && searchResults.length === 0 && (
          <Box sx={{ textAlign: 'center', my: 4, p: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
            <Typography variant="h6">No results found</Typography>
            <Typography color="textSecondary" sx={{ mt: 1 }}>
              {(searchQuery || startDate || endDate) ? (
                <>
                  No goals match your search criteria. Try:
                  <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '8px' }}>
                    {searchQuery && <li>Using different keywords</li>}
                    {(startDate || endDate) && <li>Expanding the date range</li>}
                    <li>Clearing some filters</li>
                  </ul>
                </>
              ) : (
                'Please enter search terms or select a date range'
              )}
            </Typography>
          </Box>
        )}
        
        {!loading && searchResults.length > 0 && (
          <>
            <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1 }}>
              <Typography variant="h5">
                Search Results ({searchResults.length})
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                {!searchQuery && !startDate && !endDate ? 'All goals' : 
                  <span>
                    {searchQuery && <span>Title contains "{searchQuery}"</span>}
                    {searchQuery && (startDate || endDate) && <span> or </span>}
                    {startDate && endDate && <span>Created between {formatDate(startDate)} and {formatDate(endDate)}</span>}
                    {startDate && !endDate && <span>Created since {formatDate(startDate)}</span>}
                    {!startDate && endDate && <span>Created before {formatDate(endDate)}</span>}
                  </span>
                }
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {searchResults.map((goal) => {
                const goalId = goal._id || goal.id;
                const priorityColor = goal.priority === 'High' ? '#f8d7da' : 
                                      goal.priority === 'Medium' ? '#fff3cd' : 
                                      goal.priority === 'Low' ? '#d1e7dd' : '#e2e3e5';
                
                return (
                  <Grid item xs={12} md={6} lg={4} key={goalId}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 3
                        }
                      }}
                      onClick={() => viewGoalDetails(goalId)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6">{goal.title}</Typography>
                        </Box>
                        <Chip 
                          label={goal.priority || 'Medium'} 
                          size="small" 
                          sx={{ 
                            bgcolor: priorityColor,
                            color: 'text.primary',
                            fontWeight: 'bold',
                            minWidth: '60px'
                          }} 
                        />
                      </Box>
                      
                      {goal.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {goal.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 'auto' }}>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {goal.targetDate ? formatDate(goal.targetDate) : (goal.dueDate ? formatDate(goal.dueDate) : 'No date')}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Button
                              size="small"
                              endIcon={<ChevronRightIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                viewGoalDetails(goalId);
                              }}
                            >
                              View Details
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Box>
      
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity={searchResults.length > 0 ? "info" : "warning"} 
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={handleCloseError}>
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Search; 