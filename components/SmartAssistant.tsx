import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Bot, Sparkles, MapPin } from 'lucide-react';

interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

interface Message {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your Nadayu28 Concierge. How can I help you today?' }
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
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) {
        throw new Error("API Key not found");
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `
        You are the AI Concierge for Nadayu28, a residential complex.
        Strictly answer questions based on these community rules:
        1. Visitor Parking: Must book 1 hour in advance. Max 24 hours. Quota: Unlimited bookings per unit. License plate required.
        2. Amenities (Gym, BBQ, etc.): Unlimited usage. Bookings available 6 AM - 10 PM.
        3. Fines: RM 50 for overstaying parking. RM 20 for late cancellation (less than 24h).
        4. Damages: Any damage to amenities will be charged directly to the resident's account. No deposit required.
        
        If the user asks about locations (e.g., "Where is the nearest cafe?", "Location of Nadayu28"), use the Google Maps tool to provide accurate answers.
        
        Keep answers concise, polite, and helpful. Format your response with clear paragraphs.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `System: ${systemPrompt}\n\nUser: ${userMsg}` }] }
        ],
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      const text = response.text || "I'm sorry, I couldn't process that request right now.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

      setMessages(prev => [...prev, { role: 'model', text, groundingChunks }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the concierge service. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className={`pointer-events-auto transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}>
        {isOpen && (
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-900/20 w-80 sm:w-96 flex flex-col overflow-hidden border border-white/20 mb-4 animate-fade-in-up" style={{ height: '520px' }}>
            {/* Header */}
            <div className="bg-slate-900 p-5 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x opacity-90"></div>
              <div className="flex items-center space-x-3 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                   <Bot size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm block tracking-wide">Concierge AI</span>
                  <span className="text-[10px] text-indigo-100 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> Online
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors relative z-10 text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>
  
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 scrollbar-hide">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-[90%]`}>
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 mr-3 mt-1 shadow-md border border-white">
                        <Sparkles size={14} />
                      </div>
                    )}
                    <div className={`rounded-2xl px-5 py-3.5 text-sm shadow-sm leading-relaxed relative ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-200' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-slate-200'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                  {/* Grounding Citations */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                     <div className={`mt-3 ml-12 flex flex-wrap gap-2 max-w-[85%]`}>
                        {msg.groundingChunks.map((chunk, i) => {
                          const url = chunk.web?.uri || chunk.maps?.uri;
                          const title = chunk.web?.title || chunk.maps?.title || 'View Source';
                          if (!url) return null;
                          
                          return (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            >
                              <MapPin size={10} /> {title}
                            </a>
                          );
                        })}
                     </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-center ml-1">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 mr-3 shadow-md border border-white">
                      <Sparkles size={14} />
                    </div>
                  <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
  
            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-6 pr-14 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 placeholder:text-slate-400 font-medium shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
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
            className="group relative bg-slate-900 hover:bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:scale-110 flex items-center justify-center ring-4 ring-white"
          >
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            <MessageCircle size={28} />
            <span className="absolute right-full mr-6 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap pointer-events-none">
              Need Help?
            </span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};