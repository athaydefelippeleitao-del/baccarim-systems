import { google } from 'googleapis';

export async function syncEventToGoogleCalendar(tokens: any, eventData: {
  summary: string;
  description: string;
  start: string;
  end: string;
  location?: string;
}) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/google/callback`
  );

  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: eventData.summary,
    location: eventData.location || '',
    description: eventData.description,
    start: {
      date: eventData.start, // Use 'date' for all-day events
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      date: eventData.end,
      timeZone: 'America/Sao_Paulo',
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}
