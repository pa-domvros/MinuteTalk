// This is a Netlify serverless function.
// Save this file in the following folder structure in your project:
// /
// |-- index.html
// |-- netlify/
//     |-- functions/
//         |-- generate-audio.js

// We need to use 'node-fetch' because the standard 'fetch' is not available in this server environment.
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { text } = JSON.parse(event.body);
        if (!text) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };
        }

        // IMPORTANT: You must add your API Key as an environment variable in your Netlify project settings.
        // Name the variable: GOOGLE_API_KEY
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
             console.error("API Key is not configured.");
             return { statusCode: 500, body: JSON.stringify({ error: 'API Key is not configured on the server.' }) };
        }

        const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{ text: `Say in a standard British English accent: ${text}` }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
            },
            model: "gemini-2.5-flash-preview-tts"
        };

        const googleResponse = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!googleResponse.ok) {
            const errorBody = await googleResponse.text();
            console.error('Google API Error:', errorBody);
            return { statusCode: googleResponse.status, body: JSON.stringify({ error: 'Failed to fetch from Google API.' }) };
        }

        const result = await googleResponse.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (!audioData || !mimeType) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Audio data not found in Google API response.' }) };
        }

        // Return the audio data to the front-end
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioData: audioData,
                mimeType: mimeType
            })
        };

    } catch (error) {
        console.error('Serverless function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

I am confident that deploying this new structure to a service like Netlify will resolve the issue. It's a more advanced setup, but it's the correct way to handle this type of probl