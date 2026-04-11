export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Missing API key configuration' });
  }

  try {
    const { messages } = req.body;

    // تحويل صيغة الرسائل من DeepSeek/OpenAI إلى صيغة Gemini
    // Gemini يتوقع array من { role: "user" | "model", parts: [{ text: "..." }] }
    const geminiMessages = messages
      .filter(msg => msg.role !== 'system') // Gemini لا يدعم system role مباشرة في generateContent، سنضيفه في أول رسالة user إن أمكن
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // إذا كان هناك system message، نضيفه كمقدمة لأول رسالة user
    const systemMsg = messages.find(msg => msg.role === 'system');
    if (systemMsg && geminiMessages.length > 0) {
      const firstUserIndex = geminiMessages.findIndex(m => m.role === 'user');
      if (firstUserIndex !== -1) {
        geminiMessages[firstUserIndex].parts[0].text = 
          `${systemMsg.content}\n\n${geminiMessages[firstUserIndex].parts[0].text}`;
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Gemini API error' 
      });
    }

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;
    
    // تحويل الرد إلى صيغة متوافقة مع الواجهة (OpenAI-like)
    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: reply
        }
      }]
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
