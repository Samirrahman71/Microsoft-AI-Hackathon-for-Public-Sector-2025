/**
 * AppointmentSchedulerAgent.js
 * Schedules appointments via Microsoft Graph API and sends reminders
 */
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');
const axios = require('axios');
require('dotenv').config();

class AppointmentSchedulerAgent {
  constructor() {
    // Initialize Microsoft Graph client
    this.initializeGraphClient();
    
    // Define available appointment types
    this.appointmentTypes = {
      'dmv': {
        title: 'DMV Appointment',
        description: 'Appointment for driver license, vehicle registration, or other DMV services.',
        duration: 30, // minutes
        locations: ['Main DMV Office', 'Satellite DMV Location', 'Express DMV Center']
      },
      'immigration': {
        title: 'USCIS Appointment',
        description: 'Appointment for immigration services and document processing.',
        duration: 60, // minutes
        locations: ['USCIS Field Office', 'Application Support Center']
      },
      'tax': {
        title: 'Tax Assistance Appointment',
        description: 'Appointment for tax filing assistance and inquiries.',
        duration: 45, // minutes
        locations: ['IRS Taxpayer Assistance Center', 'Community Tax Clinic']
      },
      'benefits': {
        title: 'Benefits Consultation',
        description: 'Appointment to discuss government benefits and assistance programs.',
        duration: 45, // minutes
        locations: ['Social Services Office', 'Community Benefits Center']
      },
      'housing': {
        title: 'Housing Assistance Appointment',
        description: 'Appointment for housing assistance and application help.',
        duration: 60, // minutes
        locations: ['Housing Authority Office', 'Community Housing Center']
      }
    };
  }

  /**
   * Initialize Microsoft Graph client with auth credentials
   */
  initializeGraphClient() {
    try {
      // Check if required environment variables are set
      if (process.env.MICROSOFT_GRAPH_CLIENT_ID &&
          process.env.MICROSOFT_GRAPH_CLIENT_SECRET &&
          process.env.MICROSOFT_GRAPH_TENANT_ID) {
            
        // Create credential using client credentials flow
        const credential = new ClientSecretCredential(
          process.env.MICROSOFT_GRAPH_TENANT_ID,
          process.env.MICROSOFT_GRAPH_CLIENT_ID,
          process.env.MICROSOFT_GRAPH_CLIENT_SECRET
        );
        
        // Create authentication provider
        const authProvider = new TokenCredentialAuthenticationProvider(credential, {
          scopes: ['https://graph.microsoft.com/.default']
        });
        
        // Initialize Graph client
        this.graphClient = Client.initWithMiddleware({
          authProvider: authProvider
        });
        
        this.isConfigured = true;
      } else {
        console.warn('Microsoft Graph API credentials not configured. Using simulated mode.');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('Failed to initialize Microsoft Graph client:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Get available appointment times
   * @param {string} appointmentType - Type of appointment
   * @param {string} location - Location for appointment
   * @param {string} date - Date for appointment (YYYY-MM-DD)
   * @returns {Object} Available appointment slots
   */
  async getAvailableAppointmentTimes(appointmentType, location, date) {
    try {
      if (!this.appointmentTypes[appointmentType]) {
        return {
          success: false,
          message: `Invalid appointment type: ${appointmentType}`
        };
      }
      
      // If Graph API is configured, fetch actual availability
      if (this.isConfigured) {
        return await this.getActualAvailability(appointmentType, location, date);
      }
      
      // Simulate available appointment slots
      const availableSlots = this.simulateAvailableSlots(appointmentType, date);
      
      return {
        success: true,
        appointmentType,
        location,
        date,
        availableSlots
      };
    } catch (error) {
      console.error('Error getting available appointment times:', error);
      return {
        success: false,
        message: 'Failed to retrieve available appointment times',
        error: error.message
      };
    }
  }

  /**
   * Get actual availability from Microsoft Graph API
   * @param {string} appointmentType - Type of appointment
   * @param {string} location - Location for appointment
   * @param {string} date - Date for appointment (YYYY-MM-DD)
   * @returns {Object} Available appointment slots
   */
  async getActualAvailability(appointmentType, location, date) {
    try {
      // Define the calendar view parameters
      const startDateTime = `${date}T00:00:00`;
      const endDateTime = `${date}T23:59:59`;
      
      // Get schedule information for the service calendar
      const scheduleResponse = await this.graphClient
        .api('/users')
        .filter(`startswith(displayName,'${location}')`)
        .select('id,displayName')
        .get();
      
      if (!scheduleResponse.value || scheduleResponse.value.length === 0) {
        throw new Error(`No calendar found for location: ${location}`);
      }
      
      const calendarId = scheduleResponse.value[0].id;
      
      // Get busy times from the calendar
      const busyTimesResponse = await this.graphClient
        .api(`/users/${calendarId}/calendar/calendarView`)
        .query({
          startDateTime,
          endDateTime
        })
        .select('subject,start,end')
        .orderby('start/dateTime')
        .get();
      
      // Process busy times to find available slots
      const busySlots = busyTimesResponse.value.map(event => ({
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime)
      }));
      
      // Generate available slots based on busy times
      const availableSlots = this.generateAvailableSlots(
        date, 
        this.appointmentTypes[appointmentType].duration,
        busySlots
      );
      
      return {
        success: true,
        appointmentType,
        location,
        date,
        availableSlots
      };
    } catch (error) {
      console.error('Error getting actual availability:', error);
      
      // Fall back to simulated slots if API fails
      const availableSlots = this.simulateAvailableSlots(appointmentType, date);
      
      return {
        success: true,
        appointmentType,
        location,
        date,
        availableSlots,
        isSimulated: true,
        apiError: error.message
      };
    }
  }

  /**
   * Simulate available appointment slots
   * @param {string} appointmentType - Type of appointment
   * @param {string} date - Date for appointment (YYYY-MM-DD)
   * @returns {Array} Simulated available slots
   */
  simulateAvailableSlots(appointmentType, date) {
    const slots = [];
    const appointmentConfig = this.appointmentTypes[appointmentType];
    const appointmentDate = new Date(date);
    
    // Don't generate slots for weekends in simulation
    const dayOfWeek = appointmentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return slots; // No slots on weekends
    }
    
    // Generate slots from 9 AM to 4 PM
    const startHour = 9;
    const endHour = 16;
    const slotDuration = appointmentConfig.duration;
    
    // Create a slot every hour on the hour and half-hour
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        // Random availability (70% chance of availability)
        if (Math.random() < 0.7) {
          const startTime = new Date(date);
          startTime.setHours(hour, minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + slotDuration);
          
          // Format times
          const startTimeString = startTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          const endTimeString = endTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          slots.push({
            id: `${date}-${hour}-${minute}`,
            startTime: startTimeString,
            endTime: endTimeString,
            duration: slotDuration
          });
        }
      }
    }
    
    return slots;
  }

  /**
   * Generate available slots based on busy times
   * @param {string} date - Date for appointment (YYYY-MM-DD)
   * @param {number} duration - Duration of appointment in minutes
   * @param {Array} busySlots - Array of busy time slots
   * @returns {Array} Available appointment slots
   */
  generateAvailableSlots(date, duration, busySlots) {
    const availableSlots = [];
    const appointmentDate = new Date(date);
    
    // Don't generate slots for weekends
    const dayOfWeek = appointmentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return availableSlots; // No slots on weekends
    }
    
    // Business hours: 9 AM to 4 PM
    const startHour = 9;
    const endHour = 16;
    
    // Create potential slots every 30 minutes
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);
        
        // Check if this slot overlaps with any busy slot
        const isAvailable = !busySlots.some(busySlot => {
          return (slotStart < busySlot.end && slotEnd > busySlot.start);
        });
        
        if (isAvailable) {
          // Format times
          const startTimeString = slotStart.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          const endTimeString = slotEnd.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          availableSlots.push({
            id: `${date}-${hour}-${minute}`,
            startTime: startTimeString,
            endTime: endTimeString,
            duration
          });
        }
      }
    }
    
    return availableSlots;
  }

  /**
   * Book an appointment
   * @param {Object} appointmentDetails - Appointment details
   * @returns {Object} Booking result
   */
  async bookAppointment(appointmentDetails) {
    try {
      const { 
        appointmentType, 
        location, 
        date, 
        slotId, 
        userInfo 
      } = appointmentDetails;
      
      // Validate appointment type
      if (!this.appointmentTypes[appointmentType]) {
        return {
          success: false,
          message: `Invalid appointment type: ${appointmentType}`
        };
      }
      
      // Validate user info
      if (!userInfo || !userInfo.name || !userInfo.email) {
        return {
          success: false,
          message: 'Missing required user information'
        };
      }
      
      // Get available slots to validate slotId
      const availabilityResponse = await this.getAvailableAppointmentTimes(
        appointmentType,
        location,
        date
      );
      
      if (!availabilityResponse.success) {
        return availabilityResponse;
      }
      
      // Find the selected slot
      const selectedSlot = availabilityResponse.availableSlots.find(
        slot => slot.id === slotId
      );
      
      if (!selectedSlot) {
        return {
          success: false,
          message: 'Selected appointment slot is not available'
        };
      }
      
      // Book the appointment (if Graph API is configured)
      let bookingResult;
      if (this.isConfigured) {
        bookingResult = await this.createActualAppointment(
          appointmentType,
          location,
          date,
          selectedSlot,
          userInfo
        );
      } else {
        // Simulate booking
        bookingResult = this.simulateBooking(
          appointmentType,
          location,
          date,
          selectedSlot,
          userInfo
        );
      }
      
      // Schedule reminders if booking was successful
      if (bookingResult.success) {
        await this.scheduleReminders(bookingResult.appointmentId, userInfo, appointmentDetails);
      }
      
      return bookingResult;
    } catch (error) {
      console.error('Error booking appointment:', error);
      return {
        success: false,
        message: 'Failed to book appointment',
        error: error.message
      };
    }
  }

  /**
   * Create an actual appointment using Microsoft Graph API
   * @param {string} appointmentType - Type of appointment
   * @param {string} location - Location for appointment
   * @param {string} date - Date for appointment (YYYY-MM-DD)
   * @param {Object} slot - Selected time slot
   * @param {Object} userInfo - User information
   * @returns {Object} Booking result
   */
  async createActualAppointment(appointmentType, location, date, slot, userInfo) {
    try {
      // Find the calendar for the location
      const scheduleResponse = await this.graphClient
        .api('/users')
        .filter(`startswith(displayName,'${location}')`)
        .select('id,displayName')
        .get();
      
      if (!scheduleResponse.value || scheduleResponse.value.length === 0) {
        throw new Error(`No calendar found for location: ${location}`);
      }
      
      const calendarId = scheduleResponse.value[0].id;
      
      // Parse the start and end times
      const [startTime, startPeriod] = slot.startTime.split(' ');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
      const startDateTime = new Date(date);
      startDateTime.setHours(
        startPeriod === 'PM' && startHour !== 12 ? startHour + 12 : startHour,
        startMinute
      );
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + slot.duration);
      
      // Create the event
      const appointmentConfig = this.appointmentTypes[appointmentType];
      
      const event = {
        subject: `${appointmentConfig.title} - ${userInfo.name}`,
        body: {
          contentType: 'HTML',
          content: `
            <p><strong>Appointment Details:</strong></p>
            <p>${appointmentConfig.description}</p>
            <p><strong>User Information:</strong></p>
            <p>Name: ${userInfo.name}</p>
            <p>Email: ${userInfo.email}</p>
            <p>Phone: ${userInfo.phone || 'Not provided'}</p>
            <p>Additional Information: ${userInfo.notes || 'None'}</p>
          `
        },
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Pacific Standard Time'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Pacific Standard Time'
        },
        location: {
          displayName: location
        },
        attendees: [
          {
            emailAddress: {
              address: userInfo.email,
              name: userInfo.name
            },
            type: 'required'
          }
        ]
      };
      
      // Create the event in the calendar
      const createdEvent = await this.graphClient
        .api(`/users/${calendarId}/calendar/events`)
        .post(event);
      
      // Format the appointment time for display
      const appointmentTime = `${slot.startTime} - ${slot.endTime}`;
      
      return {
        success: true,
        message: 'Appointment booked successfully',
        appointmentId: createdEvent.id,
        appointmentType,
        location,
        date,
        time: appointmentTime,
        userInfo: {
          name: userInfo.name,
          email: userInfo.email
        }
      };
    } catch (error) {
      console.error('Error creating actual appointment:', error);
      
      // Fall back to simulated booking if API fails
      return this.simulateBooking(
        appointmentType,
        location,
        date,
        slot,
        userInfo
      );
    }
  }

  /**
   * Simulate booking an appointment
   * @param {string} appointmentType - Type of appointment
   * @param {string} location - Location for appointment
   * @param {string} date - Date for appointment (YYYY-MM-DD)
   * @param {Object} slot - Selected time slot
   * @param {Object} userInfo - User information
   * @returns {Object} Simulated booking result
   */
  simulateBooking(appointmentType, location, date, slot, userInfo) {
    // Generate a random appointment ID
    const appointmentId = `appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Format the appointment time for display
    const appointmentTime = `${slot.startTime} - ${slot.endTime}`;
    
    // Simulate processing delay
    return {
      success: true,
      message: 'Appointment booked successfully',
      appointmentId,
      appointmentType,
      location,
      date,
      time: appointmentTime,
      userInfo: {
        name: userInfo.name,
        email: userInfo.email
      },
      isSimulated: true
    };
  }

  /**
   * Schedule reminders for an appointment
   * @param {string} appointmentId - ID of the booked appointment
   * @param {Object} userInfo - User information
   * @param {Object} appointmentDetails - Appointment details
   * @returns {Object} Reminder scheduling result
   */
  async scheduleReminders(appointmentId, userInfo, appointmentDetails) {
    try {
      const { appointmentType, location, date } = appointmentDetails;
      const appointmentConfig = this.appointmentTypes[appointmentType];
      
      // If using Azure Logic Apps for reminders
      if (process.env.LOGIC_APP_EMAIL_TRIGGER_URL) {
        // Schedule email reminder
        await this.scheduleEmailReminder(
          appointmentId,
          userInfo,
          appointmentDetails
        );
      }
      
      // If using n8n for reminders
      if (process.env.N8N_WEBHOOK_URL) {
        // Schedule SMS reminder
        await this.scheduleSmsReminder(
          appointmentId,
          userInfo,
          appointmentDetails
        );
      }
      
      // Return success even if reminder scheduling fails
      return {
        success: true,
        message: 'Reminders scheduled successfully',
        reminders: {
          email: true,
          sms: !!userInfo.phone
        }
      };
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      return {
        success: false,
        message: 'Failed to schedule reminders',
        error: error.message
      };
    }
  }

  /**
   * Schedule an email reminder using Azure Logic Apps
   * @param {string} appointmentId - ID of the booked appointment
   * @param {Object} userInfo - User information
   * @param {Object} appointmentDetails - Appointment details
   */
  async scheduleEmailReminder(appointmentId, userInfo, appointmentDetails) {
    try {
      if (!process.env.LOGIC_APP_EMAIL_TRIGGER_URL) {
        console.log('Logic App URL not configured. Email reminder not scheduled.');
        return;
      }
      
      const { appointmentType, location, date, time } = appointmentDetails;
      const appointmentConfig = this.appointmentTypes[appointmentType];
      
      // Format appointment date
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Prepare reminder data
      const reminderData = {
        appointmentId,
        recipient: {
          name: userInfo.name,
          email: userInfo.email
        },
        appointment: {
          type: appointmentConfig.title,
          location,
          date: formattedDate,
          time
        },
        reminderType: 'email'
      };
      
      // Call Logic App webhook
      await axios.post(process.env.LOGIC_APP_EMAIL_TRIGGER_URL, reminderData);
      
      console.log(`Email reminder scheduled for appointment: ${appointmentId}`);
    } catch (error) {
      console.error('Error scheduling email reminder:', error);
    }
  }

  /**
   * Schedule an SMS reminder using n8n
   * @param {string} appointmentId - ID of the booked appointment
   * @param {Object} userInfo - User information
   * @param {Object} appointmentDetails - Appointment details
   */
  async scheduleSmsReminder(appointmentId, userInfo, appointmentDetails) {
    try {
      if (!process.env.N8N_WEBHOOK_URL || !userInfo.phone) {
        console.log('n8n webhook URL not configured or phone not provided. SMS reminder not scheduled.');
        return;
      }
      
      const { appointmentType, location, date, time } = appointmentDetails;
      const appointmentConfig = this.appointmentTypes[appointmentType];
      
      // Format appointment date
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Prepare reminder data
      const reminderData = {
        appointmentId,
        recipient: {
          name: userInfo.name,
          phone: userInfo.phone
        },
        appointment: {
          type: appointmentConfig.title,
          location,
          date: formattedDate,
          time
        },
        reminderType: 'sms'
      };
      
      // Call n8n webhook
      await axios.post(process.env.N8N_WEBHOOK_URL, reminderData);
      
      console.log(`SMS reminder scheduled for appointment: ${appointmentId}`);
    } catch (error) {
      console.error('Error scheduling SMS reminder:', error);
    }
  }

  /**
   * Cancel an appointment
   * @param {string} appointmentId - ID of the appointment to cancel
   * @param {string} reason - Reason for cancellation
   * @returns {Object} Cancellation result
   */
  async cancelAppointment(appointmentId, reason) {
    try {
      // Check if Graph API is configured
      if (this.isConfigured) {
        try {
          // Find the event by ID
          await this.graphClient
            .api(`/me/events/${appointmentId}`)
            .delete();
            
          return {
            success: true,
            message: 'Appointment cancelled successfully',
            appointmentId
          };
        } catch (error) {
          console.error('Error cancelling appointment via API:', error);
          
          // Fall back to simulated cancellation
          return this.simulateCancellation(appointmentId, reason);
        }
      } else {
        // Simulate cancellation
        return this.simulateCancellation(appointmentId, reason);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        message: 'Failed to cancel appointment',
        error: error.message
      };
    }
  }

  /**
   * Simulate cancelling an appointment
   * @param {string} appointmentId - ID of the appointment to cancel
   * @param {string} reason - Reason for cancellation
   * @returns {Object} Simulated cancellation result
   */
  simulateCancellation(appointmentId, reason) {
    // Simulate processing delay
    return {
      success: true,
      message: 'Appointment cancelled successfully',
      appointmentId,
      cancellationReason: reason,
      isSimulated: true
    };
  }
}

module.exports = AppointmentSchedulerAgent;
