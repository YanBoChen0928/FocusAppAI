import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiService from "../services/api";
import { useUserStore } from "../store/userStore";
import styles from "./Login.module.css";

/**
 * Login Component
 *
 * This component:
 * 1. Displays a login form with email and password fields
 * 2. Handles form submission and authentication
 * 3. Stores user data and token in localStorage on successful login
 * 4. Provides links to Register and Guest Login pages
 *
 * Route: /login
 * Next route: / (after successful login)
 */
function Login() {
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Loading state for form submission
  const [loading, setLoading] = useState(false);

  // Error message state
  const [error, setError] = useState("");

  // Navigation hook for redirect after login
  const navigate = useNavigate();

  // User store from Zustand
  const setUser = useUserStore((state) => state.setUser);

  /**
   * Update form data when inputs change
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user types
    if (error) setError("");
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    console.log("Starting login process...");

    try {
      // use wrapped API service for login
      const response = await apiService.auth.login(formData);
      console.log("Login successful, response:", response.data);

      // check if cookie is set successfully
      const hasCookie = document.cookie.includes('token=');
      console.log("Cookie check:", {
        hasCookie: hasCookie,
        cookies: document.cookie
      });

      // Store user ID in localStorage
      localStorage.setItem("userId", response.data.data.id);
      console.log("User ID saved to localStorage:", response.data.data.id);
      
      // Remove tempId if it exists (user was previously a guest)
      localStorage.removeItem("tempId");
      
      // Update Zustand store with user data
      setUser(response.data.data);

      // Redirect to home page
      console.log("Redirecting to home page...");
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);

      // Display appropriate error message
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      // Stop loading state
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.appTitle}>Focus</h1>
      <p className={styles.subtitle}>Track your goals, boost productivity, 
        <br />
        and achieve more every day
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.loginForm}>
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
            placeholder="Your password"
            className={styles.formInput}
          />
        </div>

        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className={styles.loginOptions}>
        <p>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
        <p className={styles.orDivider}>or</p>
        <Link to="/guest-login" className={styles.guestLoginLink}>
          Continue as Guest
        </Link>
      </div>
    </div>
  );
}

export default Login;
