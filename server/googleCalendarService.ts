import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as db from "./db";

const calendar = google.calendar("v3");

/**
 * Google Calendar Service
 * Handles authentication, synchronization, and event management with Google Calendar
 */
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private clientId: string;
  private clientSecret: string;
  private redirectUrl: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || "";
    this.redirectUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/api/oauth/google-calendar/callback`;

    this.oauth2Client = new OAuth2Client(this.clientId, this.clientSecret, this.redirectUrl);
  }

  /**
   * Generate OAuth2 authorization URL
   */
  public getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to exchange code:", error);
      throw error;
    }
  }

  /**
   * Create or update Google Calendar event
   */
  public async syncDeadlineToCalendar(
    userId: number,
    caseId: number,
    deadline: any,
    accessToken: string,
    calendarId: string
  ): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const event = {
        summary: deadline.title,
        description: `Caso: ${deadline.caseTitle}\n${deadline.description || ""}`,
        start: {
          dateTime: new Date(deadline.dueDate).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: new Date(new Date(deadline.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 1 day before
            { method: "popup", minutes: 60 }, // 1 hour before
          ],
        },
      };

      const response = await calendar.events.insert({
        auth: this.oauth2Client,
        calendarId,
        requestBody: event,
      });

      console.log("[GoogleCalendarService] Event created:", response.data.id);
      return response.data;
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to sync deadline:", error);
      throw error;
    }
  }

  /**
   * Update existing Google Calendar event
   */
  public async updateCalendarEvent(
    googleEventId: string,
    deadline: any,
    accessToken: string,
    calendarId: string
  ): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const event = {
        summary: deadline.title,
        description: `Caso: ${deadline.caseTitle}\n${deadline.description || ""}`,
        start: {
          dateTime: new Date(deadline.dueDate).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: new Date(new Date(deadline.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
      };

      const response = await calendar.events.update({
        auth: this.oauth2Client,
        calendarId,
        eventId: googleEventId,
        requestBody: event,
      });

      console.log("[GoogleCalendarService] Event updated:", googleEventId);
      return response.data;
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to update event:", error);
      throw error;
    }
  }

  /**
   * Delete Google Calendar event
   */
  public async deleteCalendarEvent(
    googleEventId: string,
    accessToken: string,
    calendarId: string
  ): Promise<void> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      await calendar.events.delete({
        auth: this.oauth2Client,
        calendarId,
        eventId: googleEventId,
      });

      console.log("[GoogleCalendarService] Event deleted:", googleEventId);
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to delete event:", error);
      throw error;
    }
  }

  /**
   * Watch calendar for changes via webhook
   */
  public async watchCalendar(
    accessToken: string,
    calendarId: string,
    channel: { id: string; type: string; address: string }
  ): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const response = await calendar.events.watch({
        auth: this.oauth2Client,
        calendarId,
        requestBody: {
          id: channel.id,
          type: channel.type,
          address: channel.address,
        },
      });

      console.log("[GoogleCalendarService] Watch subscription created:", response.data.id);
      return response.data;
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to watch calendar:", error);
      throw error;
    }
  }

  /**
   * List recently modified events from Google Calendar
   */
  public async listRecentlyModifiedEvents(
    accessToken: string,
    calendarId: string,
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

      const response = await calendar.events.list({
        auth: this.oauth2Client,
        calendarId,
        maxResults,
        orderBy: "updated",
        showDeleted: true,
        updatedMin: oneHourAgo,
      });

      return response.data.items || [];
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to list recently modified events:", error);
      throw error;
    }
  }

  /**
   * List upcoming events from Google Calendar
   */
  public async listUpcomingEvents(
    accessToken: string,
    calendarId: string,
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const response = await calendar.events.list({
        auth: this.oauth2Client,
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to list events:", error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials.access_token || "";
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to refresh token:", error);
      throw error;
    }
  }

  /**
   * Get calendar details
   */
  public async getCalendarDetails(accessToken: string, calendarId: string): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const response = await calendar.calendars.get({
        auth: this.oauth2Client,
        calendarId,
      });

      return response.data;
    } catch (error) {
      console.error("[GoogleCalendarService] Failed to get calendar details:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
