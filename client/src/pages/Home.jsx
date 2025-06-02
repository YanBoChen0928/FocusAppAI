import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../components/ProfileModal";
import OnboardingModal from "../components/OnboardingModal";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import GoalDetails from "../components/GoalDetails/GoalDetails";
import ProgressReport from "../components/ProgressReport/ProgressReport";
import apiService from "../services/api";
import "../styles/Home.css";

/**
 * Home Component
 *
 * This component:
 * 1. Displays the Goal Tracker interface
 * 2. Shows placeholder content for goals (to be implemented in future iterations)
 * 3. Displays user information if logged in
 * 4. Provides logout functionality
 *
 * Route: /home or /
 */
function Home() {
  // State for user information
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // State for profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  // State for onboarding modal
  const [showOnboarding, setShowOnboarding] = useState(false);
  // State for user goals
  const [userGoals, setUserGoals] = useState([]);
  // Selected goal ID
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  // Navigation hook for redirecting if needed
  const navigate = useNavigate();

  // Check API connection status
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const isHealthy = await apiService.healthCheck();
        console.log("API health check result:", isHealthy);
      } catch (error) {
        console.error("API health check failed:", error);
      }
    };

    checkApiConnection();
  }, []);

  // Get user goals
  const fetchUserGoals = async (id, isGuest) => {
    try {
      if (!id) {
        console.log("No user ID provided for fetchUserGoals");
        setShowOnboarding(true);
        return [];
      }

      console.log(`Fetching goals for user ${id}, isGuest: ${isGuest}`);

      try {
        const response = await apiService.goals.getUserGoals(id);
        console.log("User goals API response:", response);

        if (response.data && response.data.success) {
          const goals = response.data.data || [];
          setUserGoals(goals);

          // If user has no goals, show the guide process
          if (goals.length === 0) {
            console.log("User has no goals, showing onboarding");
            setShowOnboarding(true);
          } else {
            console.log(`User has ${goals.length} goals`);
            setShowOnboarding(false);
          }

          return goals;
        } else {
          console.warn("API response success is false:", response);
          setShowOnboarding(true);
          return [];
        }
      } catch (apiError) {
        console.error("Failed to fetch user goals:", apiError);
        // if API call fails, also show onboarding
        setShowOnboarding(true);
        setUserGoals([]);
        return [];
      }
    } catch (error) {
      console.error("Error in fetchUserGoals:", error);
      setShowOnboarding(true);
      setUserGoals([]);
      return [];
    }
  };

  // Check if user is logged in (either as guest or registered)
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      console.log("=== Start fetching user data ===");

      try {
        // Check if user ID is stored in local storage
        const userId = localStorage.getItem("userId");
        const tempId = localStorage.getItem("tempId");

        console.log("User information in localStorage:", { userId, tempId });

        if (!userId && !tempId) {
          console.log("No user information found, redirecting to guest login page");
          setLoading(false);
          
          // Clear any previous navigation attempts
          localStorage.removeItem("lastRedirect");
          localStorage.setItem("lastRedirect", "/guest-login");
          
          // Force immediate redirect to guest login page with explicit return
          console.log("REDIRECTING NOW to /guest-login");
          navigate("/guest-login", { replace: true });
          return;
        }

        if (userId) {
          console.log(
            "Detected registered user ID, starting to fetch user data"
          );
          try {
            const response = await apiService.auth.getCurrentUser(userId);

            if (response.data && response.data.success) {
              console.log(
                "Successfully fetched user data:",
                response.data.data
              );
              setUser({
                ...response.data.data,
                isGuest: false,
              });

              // get user goals
              await fetchUserGoals(userId, false);
            }
          } catch (apiError) {
            console.error("Failed to fetch user data:", apiError);
            if (apiError.response?.status === 401) {
              console.log("User not authorized, clearing local storage");
              localStorage.removeItem("userId");
              navigate("/login");
            } else {
              setUser({
                id: userId,
                username: "User",
                isGuest: false,
              });

              // get user goals
              await fetchUserGoals(userId, false);
            }
          }
        } else if (tempId) {
          console.log("Detected temporary user ID:", tempId);
          setUser({
            id: tempId,
            username: "Guest User",
            isGuest: true,
          });

          // get temporary user goals
          await fetchUserGoals(tempId, true);
        }
      } catch (error) {
        console.error("User data logic error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // set up a scheduled refresh mechanism, refresh every 5 minutes instead of 30 seconds
    const refreshInterval = setInterval(() => {
      if (user) {
        console.log("Running scheduled refresh of goals data");
        const userId = user.id || user._id;
        fetchUserGoals(userId, user?.isGuest || false).catch((err) => {
          console.error("Scheduled refresh failed:", err);
        });
      }
    }, 300000); // refresh every 5 minutes (300000ms)

    return () => {
      // clear timer when component unmounts
      clearInterval(refreshInterval);
    };
  }, [navigate]);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      // Set a flag indicating the user just logged out
      localStorage.setItem("justLoggedOut", "true");
      
      // try to clear session on server
      try {
        if (user && user.isGuest) {
          // for temporary users, we do not actually delete temporary accounts
          // only clear localStorage and cookies, but keep the account in the database
          // this allows the user to return later using the same tempId
          const tempId = localStorage.getItem("tempId");

          if (tempId) {
            try {
              // only clear cookies without deleting the account
              await apiService.auth.logout();
            } catch (error) {
              console.error("Failed to logout temporary user:", error);
              // if error, still continue local cleanup
            }

            console.log("keep tempId for potential reuse:", tempId);
            // do not remove tempId from localStorage, keep it for potential reuse
          }
        } else if (user && !user.isGuest) {
          // for registered users, call logout API
          await apiService.auth.logout();

          // clear userId in localStorage
          localStorage.removeItem("userId");
        }
      } catch (error) {
        console.error("Failed to logout API:", error);
        // even if API call fails, we still continue local cleanup
        if (user && !user.isGuest) {
          localStorage.removeItem("userId");
        }
      }

      // redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout process error:", error);
      // ensure local storage is cleaned up in any case and navigate to login page
      if (user && !user.isGuest) {
        localStorage.removeItem("userId");
      }
      navigate("/login");
    }
  };

  // Toggle profile modal
  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal);
  };

  // handle onboarding complete
  const handleOnboardingComplete = async (newGoal) => {
    console.log("Onboarding complete, new goal created:", newGoal);
    setShowOnboarding(false);

    // refresh goals list immediately instead of simply adding new goal
    if (user) {
      console.log("Refreshing goals list after new goal creation");
      const userId = user.id || user._id;
      await fetchUserGoals(userId, user.isGuest);

      // select newly created goal
      if (newGoal && (newGoal._id || newGoal.id)) {
        setSelectedGoalId(newGoal._id || newGoal.id);
      }
    } else {
      console.warn("User information not available, cannot refresh goals");
      // if no user information, at least add new goal to list
      setUserGoals((prev) => [...prev, newGoal]);

      // select newly created goal
      if (newGoal && (newGoal._id || newGoal.id)) {
        setSelectedGoalId(newGoal._id || newGoal.id);
      }
    }
  };

  // close onboarding modal
  const handleCloseOnboarding = () => {
    console.log("Onboarding modal closed");
    setShowOnboarding(false);
  };

  // handle goal selection from sidebar
  const handleGoalSelect = (goal) => {
    console.log("Goal selected:", goal);
    const goalId = goal._id || goal.id;
    setSelectedGoalId(goalId);
  };

  // Reset goals state and UI
  const resetGoals = () => {
    console.log("Resetting goals state");
    setUserGoals([]);
    setSelectedGoalId(null);

    // if user has no goals, show onboarding
    if (user) {
      console.log("No goals, showing onboarding modal");
      setShowOnboarding(true);
    }
  };

  // handle priority change
  const handlePriorityChange = (goalId, newPriority, updatedGoal) => {
    console.log(
      `Home handling priority change for goal ${goalId} to ${newPriority}`
    );

    // if updated goal object is received, update the whole goal
    if (updatedGoal) {
      console.log("Updated goal received from API:", updatedGoal);

      setUserGoals((prevGoals) => {
        return prevGoals.map((goal) => {
          const currentGoalId = goal._id || goal.id;
          if (currentGoalId === goalId) {
            // keep existing properties, but update priority and other fields returned by API
            return { ...goal, ...updatedGoal };
          }
          return goal;
        });
      });
    } else {
      // if no updated goal object, only update priority
      setUserGoals((prevGoals) => {
        return prevGoals.map((goal) => {
          const currentGoalId = goal._id || goal.id;
          if (currentGoalId === goalId) {
            return { ...goal, priority: newPriority };
          }
          return goal;
        });
      });
    }
  };

  // handle goal date change
  const handleDateChange = (goalId, newDate, updatedGoal) => {
    console.log(`Home handling date change for goal ${goalId} to ${newDate}`);

    // if updated goal object is received, update the whole goal
    if (updatedGoal) {
      console.log("Updated goal with new date received from API:", updatedGoal);

      setUserGoals((prevGoals) => {
        return prevGoals.map((goal) => {
          const currentGoalId = goal._id || goal.id;
          if (currentGoalId === goalId) {
            // keep existing properties, but update target date and other fields returned by API
            return { ...goal, ...updatedGoal };
          }
          return goal;
        });
      });
    } else {
      // if no updated goal object, only update target date
      setUserGoals((prevGoals) => {
        return prevGoals.map((goal) => {
          const currentGoalId = goal._id || goal.id;
          if (currentGoalId === goalId) {
            return { ...goal, targetDate: newDate };
          }
          return goal;
        });
      });
    }
  };

  // Add handleGoalDeleted method to update goals after deletion
  const handleGoalDeleted = async (deletedGoalId) => {
    console.log(
      `Goal deleted, updating goals list. Deleted ID: ${deletedGoalId}`
    );

    // temporarily remove deleted goal (for immediate feedback)
    const updatedGoals = userGoals.filter((g) => {
      const goalId = g._id || g.id;
      return goalId !== deletedGoalId;
    });
    setUserGoals(updatedGoals);

    // check if the last goal is deleted
    const isLastGoal = updatedGoals.length === 0;

    // refresh goals list from backend (ensure synchronization with database)
    if (user) {
      console.log("Refreshing goals list after deletion");
      const userId = user.id || user._id;
      try {
        const goals = await fetchUserGoals(userId, user.isGuest);
        console.log(
          "Goals list refreshed successfully after deletion, count:",
          goals.length
        );

        // if no goals, reset state
        if (goals.length === 0) {
          resetGoals();
          return; // do not continue
        }
      } catch (error) {
        console.error("Failed to refresh goals after deletion:", error);

        // if API call fails but our local state shows no goals, still reset
        if (isLastGoal) {
          resetGoals();
          return;
        }
      }
    } else if (isLastGoal) {
      // if no user information but the last goal is deleted, also reset
      resetGoals();
      return;
    }

    // if the deleted goal is the currently selected goal, select another goal
    if (selectedGoalId === deletedGoalId) {
      // immediately select another goal, no need to wait
      if (updatedGoals.length > 0) {
        console.log(
          "Selecting another goal after deletion:",
          updatedGoals[0]._id || updatedGoals[0].id
        );
        setSelectedGoalId(updatedGoals[0]._id || updatedGoals[0].id);
      } else {
        console.log("No goals remaining after deletion, clearing selection");
        setSelectedGoalId(null);
      }
    }
  };

  // refresh single goal data
  const refreshSingleGoal = async (goalId) => {
    try {
      console.log(`Refreshing single goal data: ${goalId}`);

      // check if goalId is valid
      if (!goalId) {
        console.error("Cannot refresh goal data: goalId is invalid");
        return null;
      }

      // call API to get the latest goal data
      try {
        const response = await apiService.goals.getById(goalId);

        if (response.data && response.data.data) {
          const updatedGoal = response.data.data;
          console.log("Got latest goal data:", updatedGoal);

          // update goal data in goals array
          setUserGoals((prevGoals) => {
            return prevGoals.map((goal) => {
              const currentGoalId = goal._id || goal.id;
              if (currentGoalId === goalId) {
                return updatedGoal;
              }
              return goal;
            });
          });

          return updatedGoal;
        }
      } catch (apiError) {
        console.error(`API call failed, goalId: ${goalId}`, apiError);

        // try to return existing goal data
        const existingGoal = userGoals.find(
          (g) => g._id === goalId || g.id === goalId
        );
        if (existingGoal) {
          console.log("Returned existing goal data:", existingGoal);
          return existingGoal;
        }
      }
    } catch (error) {
      console.error("Failed to refresh goal data:", error);
    }

    return null;
  };

  return (
    <div className="home-container">
      <Header
        user={user}
        loading={loading}
        handleLogout={handleLogout}
        toggleProfileModal={toggleProfileModal}
      />

      <div className="main-content">
        {user ? (
          <>
            <Sidebar
              goals={userGoals}
              onGoalSelect={handleGoalSelect}
              onAddGoalClick={() => setShowOnboarding(true)}
              onPriorityChange={handlePriorityChange}
              onDateChange={handleDateChange}
              activeGoalId={selectedGoalId}
              sx={{ 
                width: '10%', 
                flexBasis: '10%', 
                flexGrow: 0, 
                flexShrink: 0,
                minWidth: '200px', // Ensure sidebar has minimum width for usability
                display: { xs: 'none', md: 'flex' } // Hide on mobile, show on desktop
              }}
            />
            <GoalDetails
              goals={userGoals}
              goalId={selectedGoalId}
              onGoalDeleted={handleGoalDeleted}
              refreshGoalData={refreshSingleGoal}
              sx={{ 
                width: { xs: '100%', md: '70%' },  
                flexBasis: { xs: '100%', md: '70%' }, 
                flexGrow: 0, 
                flexShrink: 0 
              }}
            />
            <ProgressReport 
              goalId={selectedGoalId} 
              sx={{ 
                width: { xs: '100%', md: '20%' }, 
                flexBasis: { xs: '100%', md: '20%' }, 
                flexGrow: 0, 
                flexShrink: 0,
                display: { xs: 'none', md: 'block' } // Hide on mobile, show on desktop
              }}
            />
          </>
        ) : (
          // Show loading indicator instead of welcome message when not authenticated
          <div className="loading-container">
            <p>Loading user data...</p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={toggleProfileModal}
          user={user}
        />
      )}

      {/* Onboarding Modal */}
      {user && (
        <OnboardingModal
          open={showOnboarding}
          onClose={handleCloseOnboarding}
          userId={user.id}
          isGuest={user.isGuest}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}

export default Home;
