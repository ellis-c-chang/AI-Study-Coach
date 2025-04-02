import API from './api';

export const askAI = async (messageData) => {
  const response = await API.post('/chat/', messageData);
  return response.data;
};

export const extractSchedulePlan = async (userMessage) => {
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `
Today is ${today}.
You are a study assistant. Your job is to extract structured study plans from user input.

Given a message like "I have an exam this Friday", return a JSON object like this:

{
  "subject": "Exam",
  "sessions": [
    { "date": "2025-04-03", "start": "18:00", "duration": 60 },
    { "date": "2025-04-04", "start": "14:00", "duration": 90 }
  ]
}

Only return the JSON. Do not include any explanations or text outside the JSON.
`;

  const response = await API.post('/chat/', {
    message: userMessage,
    system: systemPrompt,
  });

  return response.data.response;
};