import { db } from './firebase_config.js';

const GEMINI_KEY = "AIzaSyD6OJry2vr1oxENsI4Ibkru8oDTdPMEu2Y";

export function initAI() {
    const sendBtn = document.querySelector('#ai-input + button');
    const input = document.getElementById('ai-input');
    
    sendBtn?.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) return;
        
        const remaining = db.get('ai_daily');
        if (remaining <= 0) {
            alert("لقد استهلكت محاولاتك اليومية. يمكنك شراء المزيد بـ Quinn.");
            return;
        }

        appendMsg(text, true);
        input.value = '';
        db.update('ai_daily', remaining - 1);

        try {
            const response = await fetchAIResponse(text);
            appendMsg(response, false);
        } catch (e) {
            appendMsg("عذراً، حدث خطأ في الاتصال بنظام Gemini.", false);
        }
    });
}

function appendMsg(text, isUser) {
    const area = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.className = isUser ? "bg-violet-600/20 p-4 rounded-2xl border border-violet-500/30 ml-8 text-left" : "bg-white/5 p-4 rounded-2xl border border-white/10 mr-8 leading-relaxed";
    div.innerText = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

async function fetchAIResponse(prompt) {

    const target = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const url = "https://dev-edge.flowith.net/api-proxy/" + encodeURIComponent(target);
    
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
