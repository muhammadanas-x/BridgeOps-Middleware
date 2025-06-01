import { NextResponse } from 'next/server';

const uiContext = `
RBAC UI Context:
- "Create Role" button: Adds a new role which can be assigned to routes, restricting access to only that role.
- "Create Pages" button: Adds new pages to the current root directory; these pages can be dragged into the scene.
- "Generate Middleware" button: Generates signup, login, 2FA verification, and files for role-based accessibility.
- "Connect" button: Allows you to connect roles to pages/routes by clicking a role and dragging an arrow to a route.
- "View Audit" button: Displays traffic logs, user activity, and visualization charts.
- DONT RETURN IN BOLD just NORMAL TEXT.
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message input' }, { status: 400 });
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCvyNVvp5BMPZlszb9_ZRU253qghq5yAi8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${uiContext}\nUser: ${message}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();

    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no response was returned.';

    return NextResponse.json({ success: true, message: aiResponse });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
