import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import apiService from "../services/api";
import "../styles/ProfileModal.css";

/**
 * ProfileModal Component
 *
 * features:
 * 1. Display a modal window for user profile
 * 2. Allow user to update data (username, email)
 * 3. Allow user to change password
 * 4. Allow user to delete account
 * 5. Show registration option for guest users
 * 6. Provide link to full profile page
 */
function ProfileModal({ isOpen, onClose, user }) {
  const navigate = useNavigate();
  const modalRef = useRef(null);

  // user data
  const [profile, setProfile] = useState(null);
  // edit mode
  const [isEditing, setIsEditing] = useState(false);
  // change password mode
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  // confirm delete mode
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // loading state
  const [loading, setLoading] = useState(true);
  // error message
  const [error, setError] = useState("");
  // success message
  const [successMessage, setSuccessMessage] = useState("");

  // form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  // password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // handle click outside modal window
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // check if user is logged in and get data
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      setError("");

      try {
        // if user is temporary user
        if (user.isGuest) {
          setProfile({
            username: "Guest User",
            email: "",
            createdAt: new Date(),
            isGuest: true,
          });
          setFormData({
            username: "Guest User",
            email: "",
          });
          setLoading(false);
          return;
        }

        // for registered user, get user data
        const response = await apiService.users.getProfile();

        if (response.data && response.data.success) {
          const userData = response.data.data;
          setProfile(userData);
          setFormData({
            username: userData.username,
            email: userData.email,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        if (error.response && error.response.status === 401) {
          setError("Please login to access your profile.");
        } else {
          setError("Failed to fetch user profile. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isOpen, user]);

  // handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // handle password form input change
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  // handle data submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const response = await apiService.users.updateProfile(formData);

      if (response.data && response.data.success) {
        setProfile(response.data.data);
        setSuccessMessage("Profile updated successfully!");
        setIsEditing(false);
        
        // No need to dispatch custom events here
        // The apiService.users.updateProfile method now handles notification
        // to all components through the centralized userEvents system
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error.message);
      } else {
        setError("Error updating profile. Please try again later.");
      }
    }
  };

  // handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // validate if new password and confirm password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await apiService.users.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data && response.data.success) {
        setSuccessMessage("Updated password successfully!");
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Failed to update password:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error.message);
      } else {
        setError("Failed to update password. Please try again later.");
      }
    }
  };

  // handle register navigation
  const handleRegister = () => {
    onClose();
    navigate("/register");
  };
  
  // navigate to full profile page
  const navigateToProfilePage = () => {
    onClose();
    navigate("/profile");
  };

  // handle account delete
  const handleDeleteAccount = async () => {
    setError("");
    setSuccessMessage("");

    try {
      if (user.isGuest) {
        // delete temporary user
        const tempId = localStorage.getItem("tempId");
        if (tempId) {
          await apiService.tempUsers.delete(tempId);

          // clear local storage
          localStorage.removeItem("tempId");

          setSuccessMessage("Your temporary account has been successfully deleted. Redirecting to login page...");

          // delay redirecting, so the user can read the success message
          setTimeout(() => {
            onClose();
            navigate("/login");
          }, 2000);
        }
      } else {
        // delete registered user
        const response = await apiService.users.deleteAccount();

        if (response.data && response.data.success) {
          // clear local storage
          localStorage.removeItem("userId");

          setSuccessMessage("Your account has been successfully deleted. Redirecting to login page...");

          // delay redirecting, so the user can read the success message
          setTimeout(() => {
            onClose();
            navigate("/login");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error.message);
      } else {
        setError("Failed to delete account. Please try again later.");
      }
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal" ref={modalRef}>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h1 style={{ color: '#0D5E6D', marginBottom: '1.5rem', textAlign: 'center' }}>Profile</h1>

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : (
          profile && (
            <div className="profile-content">
              {!isEditing && !isChangingPassword && !showDeleteConfirm && (
                <div className="profile-info">
                  <div className="info-row">
                    <span className="info-label">Username:</span>
                    <span className="info-value">{profile.username}</span>
                  </div>
                  {!profile.isGuest && (
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{profile.email}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Creation Date:</span>
                    <span className="info-value">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!profile.isGuest && profile.lastLogin && (
                    <div className="info-row">
                      <span className="info-label">Last Login:</span>
                      <span className="info-value">
                        {new Date(profile.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="profile-actions">
                    {profile.isGuest ? (
                      <button
                        onClick={handleRegister}
                        className="btn register-btn"
                      >
                        Register Account
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn edit-btn"
                          style={{ backgroundColor: '#0D5E6D' }}
                        >
                          Edit Data
                        </button>
                        <button
                          onClick={() => setIsChangingPassword(true)}
                          className="btn password-btn"
                          style={{ backgroundColor: '#4CD7D0' }}
                        >
                          Change Password
                        </button>
                        <button
                          onClick={navigateToProfilePage}
                          className="btn view-profile-btn"
                          style={{ backgroundColor: '#2A9D8F' }}
                        >
                          View Full Profile
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn delete-btn"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {isEditing && (
                <form onSubmit={handleSubmit} className="profile-form">
                  <h2>Edit Profile</h2>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn save-btn" style={{ backgroundColor: '#0D5E6D' }}>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          username: profile.username,
                          email: profile.email,
                        });
                      }}
                      className="btn cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="form-footer">
                    <p>Need to manage more profile information?</p>
                    <button 
                      type="button" 
                      onClick={navigateToProfilePage} 
                      className="link-btn"
                    >
                      Go to full profile page
                    </button>
                  </div>
                </form>
              )}

              {isChangingPassword && !profile.isGuest && (
                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <h2>Change Password</h2>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn save-btn" style={{ backgroundColor: '#0D5E6D' }}>
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="btn cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {showDeleteConfirm && (
                <div className="delete-confirmation">
                  <h2>Confirm Delete Account</h2>
                  <p>
                    Are you sure you want to delete your{" "}
                    {profile.isGuest ? "temporary" : ""} account? This action
                    cannot be undone.
                  </p>
                  <div className="form-actions">
                    <button
                      onClick={handleDeleteAccount}
                      className="btn delete-confirm-btn"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
