import { google } from 'googleapis';
import fs from 'fs';

export class YouTubeService {
  constructor() {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn("⚠️ Missing YouTube credentials in .env. Uploads will be skipped.");
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  async uploadVideo(video) {
    if (!this.youtube) throw new Error("YouTube not configured");

    const res = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: video.title,
          description: video.description,
          tags: ['AI Generated', 'Trending', 'News'],
          categoryId: '25'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(video.videoPath)
      }
    });

    return {
      youtubeId: res.data.id,
      youtubeUrl: `https://www.youtube.com/watch?v=${res.data.id}`
    };
  }
}

export const youtubeService = new YouTubeService();
