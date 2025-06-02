import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GoalSettingGuide from "./GoalSettingGuide/GoalSettingGuide";
import apiService from "../services/api";

/**
 * User onboarding modal
 * Displays goal setting guide for new or temporary users
 */
const OnboardingModal = ({ open, onClose, userId, isGuest, onComplete }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Handle goal submission completion
  const handleGoalSubmit = async (goalData) => {
    setSubmitting(true);
    setError("");

    console.log("Starting goal submission with data:", {
      title: goalData.title,
      userId: userId,
      isGuest: isGuest,
    });

    try {
      // Log current user info
      console.log("OnboardingModal - Processing goal submission", {
        userId,
        isGuest,
      });

      // Ensure goalData is valid
      if (!goalData || typeof goalData !== "object") {
        console.error("Invalid goal data:", goalData);
        throw new Error("Invalid goal data");
      }

      // Check temporary user ID
      let finalUserId = userId;
      if (isGuest) {
        // Get from localStorage to ensure latest
        const tempIdFromStorage = localStorage.getItem("tempId");
        console.log("Temporary user ID from localStorage:", tempIdFromStorage);

        // If the passed userId differs from localStorage, use localStorage
        if (
          tempIdFromStorage &&
          tempIdFromStorage.startsWith("temp_") &&
          (!userId || userId !== tempIdFromStorage)
        ) {
          console.log(
            `Using tempId from localStorage instead of passed userId: ${tempIdFromStorage} instead of ${userId}`
          );
          finalUserId = tempIdFromStorage;
        }
      }

      // Ensure valid userId
      if (!finalUserId) {
        console.error("Unable to determine user ID, cannot create goal");
        throw new Error(
          "Unable to determine user ID. Please try logging in again."
        );
      }

      // Set userId based on user type
      const finalGoalData = {
        ...goalData,
        userId: finalUserId,
      };

      console.log("Preparing goal data for submission:", {
        userId: finalGoalData.userId,
        title: finalGoalData.title,
        description: finalGoalData.description,
        descriptionLength: finalGoalData.description
          ? finalGoalData.description.length
          : 0,
        hasDescription: !!finalGoalData.description,
        motivationInDesc:
          finalGoalData.description &&
          finalGoalData.description.includes(finalGoalData.motivation),
        titleInDesc:
          finalGoalData.description &&
          finalGoalData.description.includes(finalGoalData.title),
        targetDate: finalGoalData.targetDate,
        hasVisionImage: !!finalGoalData.visionImageUrl,
        visionImageUrl: finalGoalData.visionImageUrl
          ? `${finalGoalData.visionImageUrl.substring(0, 50)}...`
          : null,
        hasDetails: !!finalGoalData.details,
        hasSettings: !!finalGoalData.currentSettings,
      });

      // Create new goal
      let response;
      try {
        console.log("Calling API to create goal...");
        // ensure description is passed to API
        if (
          !finalGoalData.description &&
          finalGoalData.title &&
          finalGoalData.motivation
        ) {
          console.log("Generating default description, because it's missing");
          finalGoalData.description = `I want to ${finalGoalData.title}, because ${finalGoalData.motivation}.`;
        }
        response = await apiService.goals.create(finalGoalData);
        console.log("Goal creation API response:", response);
      } catch (apiError) {
        console.error("API Error details:", apiError);

        // Enhanced error logging
        console.error("API Error full details:", {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          url: apiError.config?.url,
          method: apiError.config?.method,
        });

        // Check for duplicate title error
        if (
          apiError.response &&
          apiError.response.data &&
          (apiError.response.data.error?.message?.includes("duplicate key") ||
            apiError.response.data.error?.message?.includes("E11000"))
        ) {
          throw new Error(
            "You already have a goal with this title. Please use a different title."
          );
        }

        // Check for goal limits
        if (
          apiError.response &&
          apiError.response.data &&
          apiError.response.data.error?.message?.includes("limited to")
        ) {
          throw new Error(apiError.response.data.error.message);
        }

        // If we have a detailed error message from the API, use it
        if (apiError.response?.data?.error?.message) {
          throw new Error(apiError.response.data.error.message);
        }

        // Otherwise, throw with a generic message
        throw new Error("Server error. Please try again later.");
      }

      // Check if response is valid
      if (!response || !response.data) {
        console.error("API returned invalid response:", response);
        throw new Error("Server returned invalid response");
      }

      if (response.data && response.data.success) {
        console.log("Goal created successfully:", response.data);

        // ensure we have complete goal data
        const newGoal = response.data.data;

        if (newGoal && (newGoal._id || newGoal.id)) {
          console.log(
            "Notifying parent component of successful goal creation:",
            newGoal._id || newGoal.id
          );

          // add a delay to ensure backend processing is complete
          setTimeout(() => {
            // Notify parent component after successful goal creation
            onComplete(newGoal);
          }, 100);
        } else {
          console.error("Invalid goal data returned from API:", newGoal);
          throw new Error("Server returned invalid goal data");
        }
      } else {
        console.error(
          "API returned success but response format unexpected:",
          response
        );
        setError("Error creating goal. API response format incorrect.");
      }
    } catch (err) {
      console.error("Error creating goal:", err);

      // Provide more detailed error message
      let errorMessage =
        err.message || "Error creating goal. Please try again later.";

      // Handle specific error cases from server
      if (err.response) {
        console.error("Error response:", err.response.data);
        errorMessage = err.response.data?.error?.message || errorMessage;
      }

      setError(errorMessage);

      // Log the complete error for debugging
      console.error("Complete error object:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="onboarding-dialog-title"
    >
      <DialogTitle id="onboarding-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {isGuest ? "Welcome to Focus" : "Create Your Goal"}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <GoalSettingGuide
          onComplete={handleGoalSubmit}
          isSubmitting={submitting}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
