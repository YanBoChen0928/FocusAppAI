import Goal from "../models/Goal.js";
import User from "../models/User.js";

/**
 * Get all goals for a specific user
 * 
 * @route GET /api/goals/:userId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllGoals = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Retrieving goals list, user ID: ${userId}`, {
      isTempId: typeof userId === 'string' && userId.startsWith('temp_')
    });
    
    let userExists = false;
    let queryConditions = [];
    
    // Check if user ID is a temporary user ID (starting with temp_)
    if (userId && typeof userId === 'string' && userId.startsWith('temp_')) {
      console.log(`Detected temporary user ID: ${userId}, checking if temporary user exists`);
      // For temporary users, use TempUser model to find
      const TempUser = await import("../models/TempUser.js").then(module => module.default);
      const tempUser = await TempUser.findOne({ tempId: userId });
      
      if (tempUser) {
        console.log(`Temporary user exists: ${userId}`);
        userExists = true;
        
        // For temporary users, check if there is a registered user associated with this temp ID
        const registeredUser = await User.findOne({ tempId: userId });
        if (registeredUser) {
          console.log(`Found associated registered user: ${registeredUser._id}, will query goals for both user IDs`);
          queryConditions = [
            { userId: userId },
            { userId: registeredUser._id.toString() }
          ];
        } else {
          queryConditions = [{ userId: userId }];
        }
      } else {
        console.log(`Temporary user does not exist: ${userId}`);
      }
    } else {
      // Registered user, use User model to find
      const user = await User.findById(userId);
      
      if (user) {
        console.log(`Registered user exists: ${userId}`);
        userExists = true;
        
        queryConditions = [{ userId: userId.toString() }];
        
        // If registered user is associated with a temp user ID, also query goals related to the temp ID
        if (user.tempId) {
          console.log(`Registered user is associated with temp ID: ${user.tempId}, will query goals for both IDs`);
          queryConditions.push({ userId: user.tempId });
        }
      }
    }
    
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found"
        }
      });
    }
    
    // Use $or to build query conditions, to query multiple possible userIds simultaneously
    const query = queryConditions.length > 1 ? { $or: queryConditions } : queryConditions[0];
    console.log("Query conditions:", JSON.stringify(query));
    
    // Find all goals for the user (based on current userId or previously linked tempId)
    const goals = await Goal.find(query).sort({ createdAt: -1 });
    
    console.log(`Found ${goals.length} goals, user ID: ${userId}`);
    
    res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch goals",
        details: error.message
      }
    });
  }
};

/**
 * Create a new goal
 * 
 * @route POST /api/goals
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createGoal = async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      description, 
      priority,
      motivation,
      targetDate,
      resources,
      dailyTasks,
      rewards,
      visionImageUrl,
      declaration, 
      checkpoints
    } = req.body;
    
    console.log(`===== Starting Goal Creation =====`);
    console.log(`User ID: ${userId}, Title: "${title}"`);
    console.log(`Is Temporary User ID: ${userId?.toString().startsWith('temp_') ? 'Yes' : 'No'}`);
    
    // Validate required fields
    if (!userId || !title || !description) {
      console.log(`Goal creation failed: Missing required fields`);
      return res.status(400).json({
        success: false,
        error: {
          message: "User ID, title, and description are required"
        }
      });
    }
    
    let user = null;
    let isTemporaryUser = false;
    
    // Check if user ID is a temporary user ID (starting with temp_)
    if (userId && userId.toString().startsWith('temp_')) {
      console.log(`Detected temporary user ID: ${userId}`);
      isTemporaryUser = true;
      
      // For temporary users, use TempUser model to find
      try {
        const TempUser = await import("../models/TempUser.js").then(module => module.default);
        user = await TempUser.findOne({ tempId: userId });
      } catch (modelError) {
        console.error(`Error loading temporary user model:`, modelError);
        return res.status(500).json({
          success: false,
          error: {
            message: "Server error: Failed to load user model"
          }
        });
      }
      
      if (!user) {
        console.log(`Temporary user not found: ${userId}`);
        return res.status(404).json({
          success: false,
          error: {
            message: "Temporary user not found"
          }
        });
      }
      
      // Check if temporary user already has a goal (limit: 1)
      try {
        const existingGoals = await Goal.find({ userId: userId.toString() });
        console.log(`Temporary user already has ${existingGoals.length} goals`);
        
        if (existingGoals.length >= 1) {
          console.log(`Temporary user has reached goal limit: ${existingGoals.length}`);
          return res.status(400).json({
            success: false,
            error: {
              message: "Temporary users are limited to one active goal. Please register for a full account to create more goals."
            }
          });
        }
      } catch (findError) {
        console.error(`Error querying existing goals:`, findError);
        return res.status(500).json({
          success: false,
          error: {
            message: "Server error: Failed to check existing goals"
          }
        });
      }
      
      console.log(`Temporary user exists, proceeding with goal creation`);
    } else {
      // Registered user, use User model to find
      try {
        user = await User.findById(userId);
      } catch (findError) {
        console.error(`Error querying user:`, findError);
        return res.status(500).json({
          success: false,
          error: {
            message: "Server error: Failed to find user"
          }
        });
      }
      
      if (!user) {
        console.log(`Registered user not found: ${userId}`);
        return res.status(404).json({
          success: false,
          error: {
            message: "User not found"
          }
        });
      }
      
      console.log(`Registered user exists: ${userId}`);
      
      // Check if the user has reached the limit of active goals (limit: 20)
      try {
        const activeGoals = await Goal.find({ userId: userId.toString(), status: "active" });
        console.log(`Registered user already has ${activeGoals.length} active goals`);
        
        if (activeGoals.length >= 20) {
          console.log(`Registered user has reached active goal limit: ${activeGoals.length}`);
          return res.status(400).json({
            success: false,
            error: {
              message: "You have reached the maximum number of active goals (20). Please complete or archive some goals before creating new ones."
            }
          });
        }
      } catch (findError) {
        console.error(`Error querying active goals:`, findError);
        return res.status(500).json({
          success: false,
          error: {
            message: "Server error: Failed to check existing goals"
          }
        });
      }
    }
    
    // Create goal object
    const goalData = {
      userId: userId.toString(),
      title,
      description,
      priority: priority || "Medium",
      status: "active",
      // Add new fields
      motivation: motivation || "",
      targetDate: targetDate || null,
      resources: resources || [],
      dailyTasks: dailyTasks || [],
      rewards: rewards || [],
      visionImageUrl: visionImageUrl || null
    };
    
    // Add optional fields
    if (declaration) goalData.declaration = declaration;
    if (checkpoints) goalData.checkpoints = checkpoints;
    
    // Initialize dailyCards array
    goalData.dailyCards = [];
    
    // Log the goal data being created
    console.log("Starting to create goal, data:", {
      userId: goalData.userId,
      title: goalData.title,
      hasMotivation: !!goalData.motivation,
      hasTargetDate: !!goalData.targetDate,
      resourcesCount: goalData.resources.length,
      dailyTasksCount: goalData.dailyTasks.length,
      rewardsCount: goalData.rewards.length,
      hasVisionImage: !!goalData.visionImageUrl,
      userType: isTemporaryUser ? "Temporary User" : "Registered User"
    });
    
    // Create new goal
    let goal;
    try {
      goal = await Goal.create(goalData);
      console.log(`Goal created successfully, ID: ${goal._id}`);
    } catch (createError) {
      console.error(`Error creating goal:`, createError);
      
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to create goal",
          details: createError.message
        }
      });
    }
    
    res.status(201).json({
      success: true,
      data: goal
    });
    
    console.log(`===== Goal Creation Completed =====`);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to create goal",
        details: error.message
      }
    });
  }
};

/**
 * Get a specific goal by ID
 * 
 * @route GET /api/goals/detail/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const goal = await Goal.findById(id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found"
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error("Error fetching goal:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch goal",
        details: error.message
      }
    });
  }
};

/**
 * Update a goal
 * 
 * @route PUT /api/goals/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Processing goal update request, ID: ${id}`, {
      requestBody: JSON.stringify(req.body, null, 2)
    });
    
    const { 
      title, 
      description, 
      priority,
      motivation,
      targetDate,
      resources,
      dailyTasks,
      rewards,
      visionImageUrl,
      declaration, 
      checkpoints, 
      status,
      dailyCards
    } = req.body;
    
    // Log date updates, important for diagnostics
    if (targetDate) {
      console.log(`Goal target date update request: ${targetDate}`, {
        dateType: typeof targetDate,
        isValid: !isNaN(new Date(targetDate).getTime()),
        parsedResult: new Date(targetDate)
      });
    }
    
    // Log vision image updates, also important for diagnostics
    if (visionImageUrl !== undefined) {
      console.log(`Vision image update request:`, {
        hasImage: !!visionImageUrl,
        imageUrlType: typeof visionImageUrl,
        imageUrlLength: visionImageUrl ? visionImageUrl.length : 0
      });
    }
    
    // Find goal
    const goal = await Goal.findById(id);
    
    if (!goal) {
      console.log(`Goal ${id} not found`);
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found"
        }
      });
    }
    
    console.log(`Found goal to update: ${goal.title}`);
    
    // Update fields
    if (title) goal.title = title;
    if (description) goal.description = description;
    if (priority) goal.priority = priority;
    if (targetDate) goal.targetDate = targetDate;
    if (declaration) goal.declaration = declaration;
    if (checkpoints) goal.checkpoints = checkpoints;
    if (status) goal.status = status;
    
    // Update new fields
    if (motivation !== undefined) goal.motivation = motivation;
    if (resources) goal.resources = resources;
    if (dailyTasks) goal.dailyTasks = dailyTasks;
    if (rewards) goal.rewards = rewards;
    if (visionImageUrl !== undefined) goal.visionImageUrl = visionImageUrl;
    if (dailyCards) goal.dailyCards = dailyCards;
    
    // Save updated goal
    await goal.save();
    console.log(`Goal updated successfully, ID: ${id}`);
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to update goal",
        details: error.message
      }
    });
  }
};

/**
 * Delete a goal
 * 
 * @route DELETE /api/goals/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const goal = await Goal.findById(id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found"
        }
      });
    }
    
    await goal.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete goal",
        details: error.message
      }
    });
  }
};

/**
 * Update goal status
 * 
 * @route PUT /api/goals/:id/status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateGoalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // *** Modification：put "archived" into the valid status list ***
    const validStatuses = ["active", "completed", "abandoned", "archived"]; // 添加 "archived"
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          // Update error message
          message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
        }
      });
    }
    
    const goal = await Goal.findById(id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found"
        }
      });
    }
    
    // update status
    goal.status = status;
    console.log(`Updating goal ${id} status to: ${status}`); 
    
    // If completed, set completedAt
    if (status === "completed") {
      goal.completedAt = new Date();
    } else {
      // For "active", "archived", "abandoned" clear completedAt
      goal.completedAt = undefined; 
    }
    
    await goal.save();
    console.log(`Goal ${id} status updated successfully.`); 
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error(`Error updating goal status for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to update goal status",
        details: error.message
      }
    });
  }
};

/**
 * Add or update a daily card for a goal
 * 
 * @route POST /api/goals/:id/daily-card
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addOrUpdateDailyCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, dailyTask, dailyReward, completed, links, records, taskCompletions } = req.body;
    
    // Find goal
    const goal = await Goal.findById(id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found"
        }
      });
    }
    
    // Convert date string to Date object and normalize to UTC midnight
    const cardDate = date ? new Date(date) : new Date();
    
    // Extract YYYY-MM-DD portion only for comparison
    const cardDateStr = `${cardDate.getFullYear()}-${String(cardDate.getMonth() + 1).padStart(2, '0')}-${String(cardDate.getDate()).padStart(2, '0')}`;
    
    console.log('Processing daily card request:', {
      goalID: id,
      requestDate: date,
      parsedDate: cardDate,
      standardizedDateString: cardDateStr,
      existingCardCount: goal.dailyCards?.length || 0,
      dailyReward: dailyReward || goal.currentSettings?.dailyReward || ''
    });
    
    // Improved date comparison logic using normalized YYYY-MM-DD strings
    const existingCardIndex = goal.dailyCards.findIndex(card => {
      if (!card.date) return false;
      
      try {
        // Convert card date to YYYY-MM-DD string format
        const existingDate = new Date(card.date);
        const existingDateStr = `${existingDate.getFullYear()}-${String(existingDate.getMonth() + 1).padStart(2, '0')}-${String(existingDate.getDate()).padStart(2, '0')}`;
        
        console.log('Date comparison:', {
          cardDate: existingDateStr,
          goalDate: cardDateStr,
          isEqual: existingDateStr === cardDateStr
        });
        
        return existingDateStr === cardDateStr;
      } catch (err) {
        console.error('Error parsing card date:', err);
        return false;
      }
    });
    
    console.log('Date comparison result:', {
      foundExistingCard: existingCardIndex !== -1,
      index: existingCardIndex
    });
    
    // Get current dailyReward from goal settings if not provided in request
    const effectiveDailyReward = dailyReward || goal.currentSettings?.dailyReward || '';
    
    if (existingCardIndex !== -1) {
      // Update existing card
      if (dailyTask) goal.dailyCards[existingCardIndex].dailyTask = dailyTask;
      // Always update dailyReward with the effective value
      goal.dailyCards[existingCardIndex].dailyReward = effectiveDailyReward;
      
      if (completed) {
        if (!goal.dailyCards[existingCardIndex].completed) {
          goal.dailyCards[existingCardIndex].completed = {};
        }
        if (completed.dailyTask !== undefined) {
          goal.dailyCards[existingCardIndex].completed.dailyTask = completed.dailyTask;
        }
        if (completed.dailyReward !== undefined) {
          goal.dailyCards[existingCardIndex].completed.dailyReward = completed.dailyReward;
        }
      }
      
      // Process task completion status
      if (taskCompletions) {
        console.log('Updating task completion status:', {
          originalStatus: goal.dailyCards[existingCardIndex].taskCompletions || {},
          newStatus: taskCompletions
        });
        
        // Completely replace task completion status object instead of shallow merge
        // Use deep copy to avoid reference issues
        goal.dailyCards[existingCardIndex].taskCompletions = JSON.parse(JSON.stringify(taskCompletions));
        
        console.log('Updated task completion status:', goal.dailyCards[existingCardIndex].taskCompletions);
      }
      
      // Process records
      if (records) {
        console.log('Adding or updating records:', records);
        goal.dailyCards[existingCardIndex].records = records;
      }
      
      if (links && links.length > 0) {
        if (!goal.dailyCards[existingCardIndex].links) {
          goal.dailyCards[existingCardIndex].links = [];
        }
        goal.dailyCards[existingCardIndex].links.push(...links);
      }
    } else {
      // Create new card
      const newCard = {
        date: cardDate,
        dailyTask: dailyTask || goal.currentSettings?.dailyTask || '',
        dailyReward: effectiveDailyReward,
        completed: completed || { dailyTask: false, dailyReward: false },
        records: records || [],
        links: links || [],
        // Use deep copy to create task completion status object to avoid reference issues
        taskCompletions: taskCompletions ? JSON.parse(JSON.stringify(taskCompletions)) : {}
      };
      
      console.log('Creating new card:', {
        date: cardDate,
        dailyReward: newCard.dailyReward,
        taskCompletionStatus: newCard.taskCompletions
      });
      
      goal.dailyCards.push(newCard);
    }

    // Check if goal.rewards is an array and ensure it includes the dailyReward
    if (!goal.rewards) {
      goal.rewards = [];
    }
    
    // Ensure goal.rewards includes the current dailyReward if it's valid
    if (effectiveDailyReward && !goal.rewards.includes(effectiveDailyReward)) {
      console.log('Adding dailyReward to goal.rewards:', effectiveDailyReward);
      goal.rewards.push(effectiveDailyReward);
    }
    
    // Save updated goal
    await goal.save();
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error("Error adding/updating daily card:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to add/update daily card",
        details: error.message
      }
    });
  }
};

export {
  getAllGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  updateGoalStatus,
  addOrUpdateDailyCard
}; 