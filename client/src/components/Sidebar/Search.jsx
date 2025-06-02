import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

/**
 * Search input component for filtering goals.
 */
function Search({ onSearchChange }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Handle input changes and notify parent
  const handleChange = (event) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    if (onSearchChange) {
      onSearchChange(newQuery); // Pass the current query up
    }
  };

  // Handle clearing the search input
  const handleClear = () => {
    setQuery('');
    if (onSearchChange) {
      onSearchChange(''); // Notify parent that search is cleared
    }
  };

  // Handle opening the advanced search page
  const handleOpenAdvancedSearch = () => {
    navigate(query ? `/search?criteria=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search goals by title..."
        value={query}
        onChange={handleChange}
        InputProps={{
          startAdornment: ( // Optional: Add a search icon at the beginning
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            // Show clear button only when there is text
            query && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={handleClear}
                  edge="end"
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          ),
        }}
      />
      <Tooltip title="Advanced Search">
        <IconButton 
          color="primary" 
          onClick={handleOpenAdvancedSearch}
          size="small"
          sx={{ ml: 1 }}
        >
          <OpenInNewIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

Search.propTypes = {
  onSearchChange: PropTypes.func.isRequired, // Callback function when search query changes
};

export default Search; 