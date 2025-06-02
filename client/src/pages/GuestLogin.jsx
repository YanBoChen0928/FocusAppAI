import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiService from "../services/api";
import styles from "./GuestLogin.module.css";

/**
 * GuestLogin Component
 * 
 * This component:
 * 1. Provides a streamlined entry point for users who don't want to create an account
 * 2. Creates a temporary account with localStorage storage only
 * 3. Stores a temporary ID in localStorage
 * 
 * Route: /guest-login
 */
function GuestLogin() {
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Carousel data
  const carouselItems = [
    {
      // Note: Adjust image paths based on your project structure
      // If images are in public/images folder, use "/images/filename.png"
      // If images are imported, use imported variables instead
      image: "/images/GoalGuide.png", 
      title: "Goal Guide",
      description: "Set clear goals with confidence"
    },
    {
      image: "/images/DailyLog.png",
      title: "Daily Log",
      description: "Celebrate small wins"
    },
    {
      image: "/images/AIFeedback.png",
      title: "AI Feedback",
      description: "Know what's working"
    }
  ];
  
  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [carouselItems.length]);
  
  // Handle manual carousel navigation
  const handleSlideChange = (index) => {
    setActiveSlide(index);
  };
  
  // Navigation hook
  const navigate = useNavigate();
  
  /**
   * Handle guest login process
   */
  const handleGuestLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      // check if tempId exists in localStorage
      const existingTempId = localStorage.getItem('tempId');
      console.log('Checking tempId in localStorage:', existingTempId);
      
      // whether there is an existing tempId, send a request to the backend
      // if there is an existing tempId, pass it to the backend for verification
      const requestData = existingTempId ? { existingTempId } : {};
      
      const response = await apiService.auth.createTempUser(requestData);
      
      if (response.data && response.data.success) {
        // Store the tempId in localStorage
        localStorage.setItem('tempId', response.data.data.tempId);
        
        console.log('Using temporary user with ID:', response.data.data.tempId);
        
        // Redirect to the home page
        navigate('/');
      } else {
        setError(response.data?.error?.message || "Guest login failed. Please try again.");
      }
    } catch (err) {
      console.error("Guest login error:", err);
      setError(
        err.response?.data?.error?.message || 
        "Could not create guest account. Please try again or register."
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.guestLoginContainer}>
      <h1 className={styles.appTitle}>Welcome to Focus</h1>
      <p className={styles.subtitle}>Stay focused. Start small. Make it happen.
      <br />
      Track one goal now — no sign-up needed.
      </p>
      
      {/* Carousel section */}
      <div className={styles.carouselContainer}>
        <div className={styles.carouselLayout}>
          {/* Left side - static image */}
          <div className={styles.leftImageContainer}>
            <img 
              src="/images/login_page.png" 
              alt="Login Page" 
              className={styles.leftImage}
              // Note: Adjust image path if needed based on your project structure
            />
          </div>
          
          {/* Right side - carousel */}
          <div className={styles.carouselWrapper}>
            <div 
              className={styles.carouselSlides}
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {carouselItems.map((item, index) => (
                <div key={index} className={styles.slide}>
                  <img src={item.image} alt={item.title} className={styles.slideImage} />
                  <div className={styles.slideCaption}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel indicators */}
            <div className={styles.carouselIndicators}>
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${activeSlide === index ? styles.activeIndicator : ''}`}
                  onClick={() => handleSlideChange(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <button 
        className={styles.guestLoginButton}
        onClick={handleGuestLogin}
        disabled={loading}
      >
        {loading ? 'Setting up guest access...' : 'Try it instantly'}
      </button>
      
      <div className={styles.loginOptions}>
        <p className={styles.orDivider}>Or</p>
        <div className={styles.authLinks}>
          <Link to="/login" className={styles.authLink}>
            Login
          </Link>
          <span className={styles.separator}>|</span>
          <Link to="/register" className={styles.authLink}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GuestLogin; 