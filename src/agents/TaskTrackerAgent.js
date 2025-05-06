/**
 * TaskTrackerAgent.js
 * Provides a visual progress UI for government task tracking
 */
class TaskTrackerAgent {
  constructor() {
    this.activeTaskFlows = new Map();
  }

  /**
   * Create a new task flow for a user
   * @param {string} userId - User identifier
   * @param {Object} taskFlow - Task flow configuration
   * @returns {Object} Created task flow with ID
   */
  createTaskFlow(userId, taskFlow) {
    try {
      if (!userId || !taskFlow) {
        return {
          success: false,
          message: 'Invalid user ID or task flow configuration'
        };
      }

      if (!taskFlow.title || !taskFlow.steps || !Array.isArray(taskFlow.steps)) {
        return {
          success: false,
          message: 'Task flow must have a title and an array of steps'
        };
      }

      // Generate a unique ID for this task flow
      const taskFlowId = `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Initialize task flow with completed status as false for all tasks
      const initializedTaskFlow = {
        ...taskFlow,
        id: taskFlowId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentStepIndex: 0,
        overallProgress: 0,
        steps: taskFlow.steps.map(step => ({
          ...step,
          complete: false,
          startedAt: null,
          completedAt: null,
          tasks: step.tasks.map(task => ({
            ...task,
            completed: false,
            completedAt: null
          }))
        }))
      };

      // Store the task flow
      const userFlows = this.activeTaskFlows.get(userId) || [];
      userFlows.push(initializedTaskFlow);
      this.activeTaskFlows.set(userId, userFlows);

      return {
        success: true,
        message: 'Task flow created successfully',
        taskFlow: initializedTaskFlow
      };
    } catch (error) {
      console.error('Error creating task flow:', error);
      return {
        success: false,
        message: 'Failed to create task flow',
        error: error.message
      };
    }
  }

  /**
   * Get all task flows for a user
   * @param {string} userId - User identifier
   * @returns {Object} All user task flows
   */
  getUserTaskFlows(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          message: 'Invalid user ID'
        };
      }

      const userFlows = this.activeTaskFlows.get(userId) || [];

      return {
        success: true,
        taskFlows: userFlows
      };
    } catch (error) {
      console.error('Error getting user task flows:', error);
      return {
        success: false,
        message: 'Failed to get user task flows',
        error: error.message
      };
    }
  }

  /**
   * Get a specific task flow by ID
   * @param {string} userId - User identifier
   * @param {string} taskFlowId - Task flow ID
   * @returns {Object} Specific task flow
   */
  getTaskFlow(userId, taskFlowId) {
    try {
      if (!userId || !taskFlowId) {
        return {
          success: false,
          message: 'Invalid user ID or task flow ID'
        };
      }

      const userFlows = this.activeTaskFlows.get(userId) || [];
      const taskFlow = userFlows.find(flow => flow.id === taskFlowId);

      if (!taskFlow) {
        return {
          success: false,
          message: 'Task flow not found'
        };
      }

      return {
        success: true,
        taskFlow
      };
    } catch (error) {
      console.error('Error getting task flow:', error);
      return {
        success: false,
        message: 'Failed to get task flow',
        error: error.message
      };
    }
  }

  /**
   * Update task completion status
   * @param {string} userId - User identifier
   * @param {string} taskFlowId - Task flow ID
   * @param {string} stepId - Step ID
   * @param {string} taskId - Task ID
   * @param {boolean} completed - Completion status
   * @returns {Object} Updated task flow
   */
  updateTaskStatus(userId, taskFlowId, stepId, taskId, completed) {
    try {
      if (!userId || !taskFlowId || !stepId || !taskId) {
        return {
          success: false,
          message: 'Invalid parameters'
        };
      }

      const userFlows = this.activeTaskFlows.get(userId) || [];
      const flowIndex = userFlows.findIndex(flow => flow.id === taskFlowId);

      if (flowIndex === -1) {
        return {
          success: false,
          message: 'Task flow not found'
        };
      }

      const taskFlow = { ...userFlows[flowIndex] };
      const stepIndex = taskFlow.steps.findIndex(step => step.id === stepId);

      if (stepIndex === -1) {
        return {
          success: false,
          message: 'Step not found'
        };
      }

      const step = { ...taskFlow.steps[stepIndex] };
      const taskIndex = step.tasks.findIndex(task => task.id === taskId);

      if (taskIndex === -1) {
        return {
          success: false,
          message: 'Task not found'
        };
      }

      // Update the task completion status
      const updatedTasks = [...step.tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };

      // Update the step with new tasks
      const updatedStep = {
        ...step,
        tasks: updatedTasks
      };

      // Check if all tasks in the step are completed
      const allTasksCompleted = updatedTasks.every(task => task.completed);
      updatedStep.complete = allTasksCompleted;
      updatedStep.completedAt = allTasksCompleted ? new Date().toISOString() : null;

      if (!updatedStep.startedAt && completed) {
        updatedStep.startedAt = new Date().toISOString();
      }

      // Update the task flow with the new step
      const updatedSteps = [...taskFlow.steps];
      updatedSteps[stepIndex] = updatedStep;

      // Calculate the current step index (the first incomplete step)
      const currentStepIndex = updatedSteps.findIndex(step => !step.complete);
      
      // If all steps are complete, set to the last step
      const newCurrentStepIndex = currentStepIndex === -1 ? updatedSteps.length - 1 : currentStepIndex;

      // Calculate overall progress
      const totalTasks = updatedSteps.reduce((sum, step) => sum + step.tasks.length, 0);
      const completedTasks = updatedSteps.reduce((sum, step) => {
        return sum + step.tasks.filter(task => task.completed).length;
      }, 0);
      
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Update the task flow
      const updatedTaskFlow = {
        ...taskFlow,
        steps: updatedSteps,
        currentStepIndex: newCurrentStepIndex,
        overallProgress,
        updatedAt: new Date().toISOString()
      };

      // Update in the store
      userFlows[flowIndex] = updatedTaskFlow;
      this.activeTaskFlows.set(userId, userFlows);

      return {
        success: true,
        message: 'Task status updated successfully',
        taskFlow: updatedTaskFlow
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        message: 'Failed to update task status',
        error: error.message
      };
    }
  }

  /**
   * Complete a step in the task flow
   * @param {string} userId - User identifier
   * @param {string} taskFlowId - Task flow ID
   * @param {string} stepId - Step ID
   * @returns {Object} Updated task flow
   */
  completeStep(userId, taskFlowId, stepId) {
    try {
      if (!userId || !taskFlowId || !stepId) {
        return {
          success: false,
          message: 'Invalid parameters'
        };
      }

      const userFlows = this.activeTaskFlows.get(userId) || [];
      const flowIndex = userFlows.findIndex(flow => flow.id === taskFlowId);

      if (flowIndex === -1) {
        return {
          success: false,
          message: 'Task flow not found'
        };
      }

      const taskFlow = { ...userFlows[flowIndex] };
      const stepIndex = taskFlow.steps.findIndex(step => step.id === stepId);

      if (stepIndex === -1) {
        return {
          success: false,
          message: 'Step not found'
        };
      }

      // Mark all tasks in this step as completed
      const updatedStep = {
        ...taskFlow.steps[stepIndex],
        complete: true,
        completedAt: new Date().toISOString(),
        tasks: taskFlow.steps[stepIndex].tasks.map(task => ({
          ...task,
          completed: true,
          completedAt: new Date().toISOString()
        }))
      };

      if (!updatedStep.startedAt) {
        updatedStep.startedAt = new Date().toISOString();
      }

      // Update the task flow with the new step
      const updatedSteps = [...taskFlow.steps];
      updatedSteps[stepIndex] = updatedStep;

      // Calculate the current step index (the first incomplete step)
      const currentStepIndex = updatedSteps.findIndex(step => !step.complete);
      
      // If all steps are complete, set to the last step
      const newCurrentStepIndex = currentStepIndex === -1 ? updatedSteps.length - 1 : currentStepIndex;

      // Calculate overall progress
      const totalTasks = updatedSteps.reduce((sum, step) => sum + step.tasks.length, 0);
      const completedTasks = updatedSteps.reduce((sum, step) => {
        return sum + step.tasks.filter(task => task.completed).length;
      }, 0);
      
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Update the task flow
      const updatedTaskFlow = {
        ...taskFlow,
        steps: updatedSteps,
        currentStepIndex: newCurrentStepIndex,
        overallProgress,
        updatedAt: new Date().toISOString()
      };

      // Update in the store
      userFlows[flowIndex] = updatedTaskFlow;
      this.activeTaskFlows.set(userId, userFlows);

      return {
        success: true,
        message: 'Step completed successfully',
        taskFlow: updatedTaskFlow
      };
    } catch (error) {
      console.error('Error completing step:', error);
      return {
        success: false,
        message: 'Failed to complete step',
        error: error.message
      };
    }
  }

  /**
   * Reset a task flow to initial state
   * @param {string} userId - User identifier
   * @param {string} taskFlowId - Task flow ID
   * @returns {Object} Reset task flow
   */
  resetTaskFlow(userId, taskFlowId) {
    try {
      if (!userId || !taskFlowId) {
        return {
          success: false,
          message: 'Invalid parameters'
        };
      }

      const userFlows = this.activeTaskFlows.get(userId) || [];
      const flowIndex = userFlows.findIndex(flow => flow.id === taskFlowId);

      if (flowIndex === -1) {
        return {
          success: false,
          message: 'Task flow not found'
        };
      }

      // Get original task flow structure
      const original = userFlows[flowIndex];

      // Reset all steps and tasks
      const resetTaskFlow = {
        ...original,
        updatedAt: new Date().toISOString(),
        currentStepIndex: 0,
        overallProgress: 0,
        steps: original.steps.map(step => ({
          ...step,
          complete: false,
          startedAt: null,
          completedAt: null,
          tasks: step.tasks.map(task => ({
            ...task,
            completed: false,
            completedAt: null
          }))
        }))
      };

      // Update in the store
      userFlows[flowIndex] = resetTaskFlow;
      this.activeTaskFlows.set(userId, userFlows);

      return {
        success: true,
        message: 'Task flow reset successfully',
        taskFlow: resetTaskFlow
      };
    } catch (error) {
      console.error('Error resetting task flow:', error);
      return {
        success: false,
        message: 'Failed to reset task flow',
        error: error.message
      };
    }
  }

  /**
   * Delete a task flow
   * @param {string} userId - User identifier
   * @param {string} taskFlowId - Task flow ID
   * @returns {Object} Deletion result
   */
  deleteTaskFlow(userId, taskFlowId) {
    try {
      if (!userId || !taskFlowId) {
        return {
          success: false,
          message: 'Invalid parameters'
        };
      }

      const userFlows = this.activeTaskFlows.get(userId) || [];
      const updatedFlows = userFlows.filter(flow => flow.id !== taskFlowId);

      if (updatedFlows.length === userFlows.length) {
        return {
          success: false,
          message: 'Task flow not found'
        };
      }

      // Update the store
      this.activeTaskFlows.set(userId, updatedFlows);

      return {
        success: true,
        message: 'Task flow deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting task flow:', error);
      return {
        success: false,
        message: 'Failed to delete task flow',
        error: error.message
      };
    }
  }

  /**
   * Generate UI representation of a task flow
   * @param {Object} taskFlow - Task flow to generate UI for
   * @returns {Object} UI representation data
   */
  generateTaskTracker(taskFlow) {
    try {
      if (!taskFlow || !taskFlow.steps) {
        return {
          success: false,
          message: 'Invalid task flow'
        };
      }

      // Generate a visual representation of the task flow
      const trackerData = {
        id: taskFlow.id,
        title: taskFlow.title,
        overallProgress: taskFlow.overallProgress,
        currentStepIndex: taskFlow.currentStepIndex,
        steps: taskFlow.steps.map((step, index) => {
          // Calculate step progress
          const totalTasks = step.tasks.length;
          const completedTasks = step.tasks.filter(task => task.completed).length;
          const stepProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Determine step status
          let status = 'upcoming';
          if (step.complete) {
            status = 'completed';
          } else if (index === taskFlow.currentStepIndex) {
            status = 'active';
          } else if (index < taskFlow.currentStepIndex) {
            status = 'in-progress';
          }

          return {
            id: step.id,
            title: step.title,
            status,
            progress: stepProgress,
            tasks: step.tasks.map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed,
              completedAt: task.completedAt
            }))
          };
        })
      };

      return {
        success: true,
        trackerData
      };
    } catch (error) {
      console.error('Error generating task tracker:', error);
      return {
        success: false,
        message: 'Failed to generate task tracker',
        error: error.message
      };
    }
  }

  /**
   * Get task flow templates by type
   * @param {string} type - Type of task flow template
   * @returns {Object} Template for the specified type
   */
  getTaskFlowTemplate(type) {
    try {
      // Define templates for different task flows
      const templates = {
        'moving': {
          title: "Moving Checklist",
          steps: [
            {
              id: "address-update",
              title: "Update Address",
              tasks: [
                { id: "usps", title: "USPS Change of Address", completed: false },
                { id: "dmv", title: "DMV Address Update", completed: false },
                { id: "voter", title: "Voter Registration Update", completed: false },
                { id: "irs", title: "IRS Address Change", completed: false }
              ]
            },
            {
              id: "utilities",
              title: "Set Up Utilities",
              tasks: [
                { id: "water", title: "Water Service", completed: false },
                { id: "power", title: "Electricity Service", completed: false },
                { id: "internet", title: "Internet Service", completed: false }
              ]
            },
            {
              id: "local-registration",
              title: "Local Registration",
              tasks: [
                { id: "pet", title: "Pet Registration", completed: false },
                { id: "schools", title: "School Registration", completed: false },
                { id: "property", title: "Property Tax Information", completed: false }
              ]
            }
          ]
        },
        'benefits': {
          title: "Benefits Application Process",
          steps: [
            {
              id: "eligibility",
              title: "Check Eligibility",
              tasks: [
                { id: "requirements", title: "Review Requirements", completed: false },
                { id: "calculator", title: "Use Benefit Calculator", completed: false }
              ]
            },
            {
              id: "documentation",
              title: "Gather Documents",
              tasks: [
                { id: "id", title: "Identification Documents", completed: false },
                { id: "income", title: "Income Verification", completed: false },
                { id: "residence", title: "Proof of Residence", completed: false },
                { id: "expenses", title: "Expense Documentation", completed: false }
              ]
            },
            {
              id: "application",
              title: "Submit Application",
              tasks: [
                { id: "form", title: "Complete Application Form", completed: false },
                { id: "submit", title: "Submit Application", completed: false },
                { id: "followup", title: "Schedule Follow-up", completed: false }
              ]
            }
          ]
        },
        'document': {
          title: "Document Understanding Process",
          steps: [
            {
              id: "upload",
              title: "Document Upload",
              tasks: [
                { id: "scan", title: "Scan Document", completed: false },
                { id: "upload", title: "Upload to System", completed: false }
              ]
            },
            {
              id: "analysis",
              title: "Document Analysis",
              tasks: [
                { id: "extract", title: "Extract Information", completed: false },
                { id: "explain", title: "Generate Explanation", completed: false }
              ]
            },
            {
              id: "action",
              title: "Take Action",
              tasks: [
                { id: "response", title: "Generate Response", completed: false },
                { id: "appeal", title: "Appeal Process (if needed)", completed: false },
                { id: "next-steps", title: "Determine Next Steps", completed: false }
              ]
            }
          ]
        },
        'appointment': {
          title: "Appointment Scheduling Process",
          steps: [
            {
              id: "preparation",
              title: "Prepare for Appointment",
              tasks: [
                { id: "docs", title: "Gather Required Documents", completed: false },
                { id: "forms", title: "Complete Pre-Appointment Forms", completed: false }
              ]
            },
            {
              id: "scheduling",
              title: "Schedule Appointment",
              tasks: [
                { id: "find-time", title: "Find Available Time Slots", completed: false },
                { id: "book", title: "Book Appointment", completed: false },
                { id: "confirm", title: "Receive Confirmation", completed: false }
              ]
            },
            {
              id: "reminders",
              title: "Appointment Reminders",
              tasks: [
                { id: "calendar", title: "Add to Calendar", completed: false },
                { id: "email", title: "Email Reminder", completed: false },
                { id: "sms", title: "SMS Reminder", completed: false }
              ]
            }
          ]
        }
      };

      // Return the requested template
      if (type && templates[type]) {
        return {
          success: true,
          template: templates[type]
        };
      } else if (!type) {
        // Return all templates if no type specified
        return {
          success: true,
          templates
        };
      } else {
        return {
          success: false,
          message: `Template for "${type}" not found`,
          availableTemplates: Object.keys(templates)
        };
      }
    } catch (error) {
      console.error('Error getting task flow template:', error);
      return {
        success: false,
        message: 'Failed to get task flow template',
        error: error.message
      };
    }
  }

  /**
   * Create task flow from a predefined template
   * @param {string} userId - User identifier
   * @param {string} templateType - Type of template to use
   * @param {Object} customization - Optional customizations to the template
   * @returns {Object} Created task flow
   */
  createTaskFlowFromTemplate(userId, templateType, customization = {}) {
    try {
      if (!userId || !templateType) {
        return {
          success: false,
          message: 'Invalid parameters'
        };
      }

      // Get the template
      const templateResponse = this.getTaskFlowTemplate(templateType);
      if (!templateResponse.success) {
        return templateResponse;
      }

      // Create a deep copy of the template
      const template = JSON.parse(JSON.stringify(templateResponse.template));

      // Apply customizations if provided
      if (customization.title) {
        template.title = customization.title;
      }

      if (customization.steps && Array.isArray(customization.steps)) {
        customization.steps.forEach(customStep => {
          if (customStep.id && customStep.tasks) {
            const stepIndex = template.steps.findIndex(step => step.id === customStep.id);
            if (stepIndex !== -1) {
              // Update step title if provided
              if (customStep.title) {
                template.steps[stepIndex].title = customStep.title;
              }

              // Update tasks if provided
              if (customStep.tasks && Array.isArray(customStep.tasks)) {
                customStep.tasks.forEach(customTask => {
                  if (customTask.id) {
                    const taskIndex = template.steps[stepIndex].tasks.findIndex(task => task.id === customTask.id);
                    if (taskIndex !== -1 && customTask.title) {
                      template.steps[stepIndex].tasks[taskIndex].title = customTask.title;
                    }
                  }
                });
              }
            }
          }
        });
      }

      // Create the task flow
      return this.createTaskFlow(userId, template);
    } catch (error) {
      console.error('Error creating task flow from template:', error);
      return {
        success: false,
        message: 'Failed to create task flow from template',
        error: error.message
      };
    }
  }
}

module.exports = TaskTrackerAgent;
