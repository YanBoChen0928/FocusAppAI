import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';
import { useUserStore } from '../store/userStore';
import styles from './Register.module.css';

/**
 * Register Component
 * 
 * This component:
 * 1. Displays a registration form with username, email, and password fields
 * 2. Handles form submission and user creation
 * 3. Stores user data and token in localStorage on successful registration
 * 4. Provides a link to the Login page
 * 
 * Route: /register
 * Next route: / (after successful registration)
 */
function Register() {
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Loading state for form submission
  const [loading, setLoading] = useState(false);
  
  // Error message state
  const [error, setError] = useState('');
  
  // Navigation hook for redirect after registration
  const navigate = useNavigate();
  
  // User store from Zustand
  const setUser = useUserStore((state) => state.setUser);

  /**
   * Update form data when inputs change
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user types
    if (error) setError('');
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill out all required fields.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Start loading state
    setLoading(true);
    
    try {
      // Send registration request using API service
      const response = await apiService.auth.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      console.log("Registration successful, response:", response.data);
      
      // Store user ID in localStorage
      localStorage.setItem('userId', response.data.data.id);
      
      // Remove tempId if it exists (user was previously a guest)
      localStorage.removeItem('tempId');
      
      // Update Zustand store with user data
      setUser(response.data.data);
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      // Handle network/server errors
      console.error('Registration error:', error);
      
      // Display appropriate error message
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error.message);
      } else {
        setError('Could not create account. Please try again later.');
      }
    } finally {
      // End loading state
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h1 className={styles.appTitle}>Focus</h1>
      <p className={styles.subtitle}>Create an account to track your goals</p>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.formLabel}>Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            placeholder="Your username"
            className={styles.formInput}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            placeholder="your@email.com"
            className={styles.formInput}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.formLabel}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            placeholder="Create a password"
            className={styles.formInput}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            placeholder="Confirm your password"
            className={styles.formInput}
          />
        </div>
        
        <button 
          type="submit"
          className={styles.registerButton}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className={styles.registerOptions}>
        <p>
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register; 