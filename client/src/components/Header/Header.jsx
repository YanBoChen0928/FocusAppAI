import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import "../../styles/Home.css"; // import styles
import apiService from "../../services/api";
import { useUserStore } from "../../store/userStore";

/**
 * Header Component
 *
 * Top navigation bar component, includes:
 * 1. Application title
 * 2. User information display (user avatar, welcome message)
 * 3. Login/logout functionality
 * 4. Guest login option
 * 5. Link to profile page (full page, not modal)
 */
export default function Header({
  user,
  loading,
  handleLogout,
  toggleProfileModal,
}) {
  const navigate = useNavigate();
  
  // Use Zustand store for user data - with fallback to props
  const storeUser = useUserStore(state => state.user);
  const isStoreLoading = useUserStore(state => state.isLoading);
  
  // Determine which user data to display (prefer Zustand store if available)
  const displayUser = storeUser || user;
  const isLoading = isStoreLoading || loading;
  
  // Check if the user is a temporary user
  const isTempUser = displayUser?.isGuest || localStorage.getItem("tempId");
  
  // Navigate to profile page when avatar is clicked
  const handleAvatarClick = () => {
    navigate("/profile");
  };

  return (
    <header className="app-header" style={{ backgroundColor: '#0D5E6D', color: 'white', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', maxWidth: '1200px' }}>
      <h1 style={{ color: 'white' }}>Focus Goal Tracker</h1>
      <div className="user-info">
        {isLoading ? (
          <span>Loading...</span>
        ) : displayUser ? (
          <div className="logged-in-user">
            <span style={{ color: "white" }}>Welcome, {displayUser.username}</span>
            <div 
              className="avatar-container" 
              onClick={handleAvatarClick}
              style={{ 
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.3)"
              }}
            >
              {displayUser.avatarUrl ? (
                <img
                  src={displayUser.avatarUrl}
                  alt="User Avatar"
                  className="avatar-image"
                />
              ) : (
                <FaUser className="avatar-icon" style={{ color: "white" }} />
              )}
            </div>
            <button 
              onClick={handleLogout} 
              className="logout-button"
              style={{ 
                backgroundColor: "#f44336",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {isTempUser ? "Leave" : "Logout"}
            </button>
          </div>
        ) : (
          <div className="guest-options">
            <button 
              onClick={() => navigate("/login")} 
              className="login-button"
              style={{ 
                backgroundColor: "#0D5E6D",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "0.5rem"
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/guest-login")}
              className="guest-button"
              style={{ 
                backgroundColor: "#4CD7D0",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Continue as Guest
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
