import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello! I am your Nadayu28 Concierge. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
      if (!apiKey) throw new Error("Groq API Key not configured.");

      const systemPrompt = `You are the AI Concierge for Nadayu28, a residential complex in Malaysia.
Answer questions based on these community rules:
1. Visitor Parking: Must book 1 hour in advance. Max 24 hours. Unlimited bookings per unit. License plate required.
2. Amenities (Gym, BBQ, etc.): Unlimited usage. Bookings available 6 AM - 10 PM.
3. Fines: RM 50 for overstaying parking. RM 20 for late cancellation (less than 24h).
4. Damages: Any damage to amenities will be charged directly to the resident's account. No deposit required.
Keep answers concise, polite, and helpful.`;

      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.text,
      }));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userMsg },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', text }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className={`pointer-events-auto transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}>
        {isOpen && (
          <div className="bg-white rounded-[2rem] shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-nadayu-border mb-4" style={{ height: '520px' }}>
            {/* Header */}
            <div className="p-5 flex justify-between items-center bg-nadayu-panel">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-nadayu-accent rounded-xl flex items-center justify-center">
                  <Bot size={20} className="text-nadayu-panel" />
                </div>
                <div>
                  <span className="font-serif font-bold text-sm block tracking-wide text-white">Concierge AI</span>
                  <span className="text-[10px] flex items-center gap-1.5 font-medium text-nadayu-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-nadayu-accent animate-pulse"></span> Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full text-nadayu-muted hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-nadayu-cream scrollbar-hide">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-[90%]`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-nadayu-panel rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                        <Sparkles size={14} className="text-nadayu-accent" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-nadayu-panel text-white rounded-tr-sm'
                        : 'bg-white border border-nadayu-border text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-center">
                  <div className="w-8 h-8 bg-nadayu-panel rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <Sparkles size={14} className="text-nadayu-accent" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-nadayu-border shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-nadayu-border">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 border border-nadayu-border rounded-full pl-5 pr-14 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-nadayu-panel focus:ring-2 focus:ring-nadayu-panel/10 transition-all bg-nadayu-cream"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 p-2.5 bg-nadayu-panel text-white rounded-full transition-all hover:bg-nadayu-accent hover:text-nadayu-panel disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={16} className={input.trim() ? "translate-x-0.5 translate-y-0.5" : ""} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-auto">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative bg-nadayu-panel text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-nadayu-accent hover:text-nadayu-panel flex items-center justify-center ring-4 ring-white"
          >
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            <MessageCircle size={28} />
            <span className="absolute right-full mr-4 px-4 py-2 rounded-xl text-xs font-bold shadow-xl bg-nadayu-panel text-white opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap pointer-events-none">
              Need Help?
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
