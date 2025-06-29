import dotenv from 'dotenv';
import axios from 'axios';
import { youtubeService } from './youtube.js';
import { Video } from '../shared/schema.js';

dotenv.config();

async function fetchNewsHeadline() {
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=1&apiKey=${apiKey}`;
  const response = await axios.get(url);
  const article = response.data.articles[0];
  return {
    title: article.title,
    description: article.description || '',
    content: article.content || '',
  };
}

async function generatePromptFromGemini(news) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Create a video prompt for this news: ${news.title}\n\n${news.description}`;
  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
    {
      contents: [{ parts: [{ text: prompt }] }]
    }
  );
  return response.data.candidates[0].content.parts[0].text;
}

async function generateVideoFromDeepAI(prompt) {
  const apiKey = process.env.DEEPAI_API_KEY;
  const response = await axios.post(
    'https://api.deepai.org/api/text2img',
    { text: prompt },
    { headers: { 'Api-Key': apiKey } }
  );

  const imageUrl = response.data.output_url;
  const filePath = `/tmp/generated-${Date.now()}.mp4`;

  const fs = await import('fs');
  const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, res.data);

  return filePath;
}

async function main() {
  try {
    const news = await fetchNewsHeadline();
    const prompt = await generatePromptFromGemini(news);
    const videoPath = await generateVideoFromDeepAI(prompt);

    const video = new Video(news.title, news.description, videoPath);
    const result = await youtubeService.uploadVideo(video);

    console.log("✅ Uploaded:", result.youtubeUrl);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Loop every hour
setInterval(main, 60 * 60 * 1000);
main();
