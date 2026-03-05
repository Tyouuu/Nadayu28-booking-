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
          <div className="bg-white rounded-[2rem] shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-white/20 mb-4 animate-fade-in-up" style={{ height: '520px', boxShadow: '0 20px 40px rgba(45, 43, 85, 0.2)' }}>
            {/* Header */}
            <div className="p-5 flex justify-between items-center text-white relative overflow-hidden" style={{ backgroundColor: '#3D3B65' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#E6B325] via-[#D4A017] to-[#E6B325] animate-gradient-x opacity-90"></div>
              <div className="flex items-center space-x-3 relative z-10">
                <div className="p-2 rounded-xl backdrop-blur-md shadow-inner border border-white/10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                   <Bot size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm block tracking-wide">Concierge AI</span>
                  <span className="text-[10px] flex items-center gap-1.5 font-medium" style={{ color: '#B0B0B8' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#E6B325', boxShadow: '0 0 8px rgba(230, 179, 37, 0.8)' }}></span> Online
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full transition-colors relative z-10" style={{ color: 'rgba(245, 245, 247, 0.8)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <X size={18} />
              </button>
            </div>
  
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide" style={{ backgroundColor: '#3D3B65' }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-[90%]`}>
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mr-3 mt-1 shadow-md border border-white" style={{ backgroundImage: 'linear-gradient(135deg, #E6B325 0%, #D4A017 100%)' }}>
                        <Sparkles size={14} />
                      </div>
                    )}
                    <div className={`rounded-2xl px-5 py-3.5 text-sm shadow-sm leading-relaxed relative ${
                      msg.role === 'user' 
                        ? 'rounded-tr-sm' 
                        : 'rounded-tl-sm'
                    }`} style={msg.role === 'user' ? { backgroundImage: 'linear-gradient(135deg, #E6B325 0%, #D4A017 100%)', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(230, 179, 37, 0.2)' } : { backgroundColor: 'rgba(61, 59, 101, 0.5)', color: '#F5F5F7', borderColor: '#4A4860', border: '1px solid', boxShadow: '0 2px 8px rgba(61, 59, 101, 0.3)' }}>
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
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5" style={{ backgroundColor: '#F5F5F7', borderColor: '#E6B325', color: '#2D2B55', border: '1.5px solid' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5D547'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
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
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mr-3 shadow-md border border-white" style={{ backgroundImage: 'linear-gradient(135deg, #E6B325 0%, #D4A017 100%)' }}>
                      <Sparkles size={14} />
                    </div>
                  <div className="px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm" style={{ backgroundColor: 'rgba(61, 59, 101, 0.5)', borderColor: '#4A4860', border: '1px solid' }}>
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#E6B325' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#E6B325', animationDelay: '0.15s' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#E6B325', animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
  
            {/* Input */}
            <div className="p-4" style={{ backgroundColor: '#2D2B55', borderTop: '1px solid #4A4860' }}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 border rounded-full pl-6 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all font-medium shadow-inner" style={{ backgroundColor: 'rgba(61, 59, 101, 0.3)', borderColor: '#4A4860', color: '#F5F5F7' }} onFocus={(e) => { e.currentTarget.style.backgroundColor = 'rgba(61, 59, 101, 0.6)'; e.currentTarget.style.borderColor = '#E6B325'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(230, 179, 37, 0.1)'; }} onBlur={(e) => { e.currentTarget.style.backgroundColor = 'rgba(61, 59, 101, 0.3)'; e.currentTarget.style.borderColor = '#4A4860'; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'; }} />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 p-2.5 text-white rounded-full transition-all hover:scale-105 active:scale-95" style={{ backgroundImage: 'linear-gradient(135deg, #E6B325 0%, #D4A017 100%)', boxShadow: '0 8px 16px rgba(230, 179, 37, 0.2)', opacity: isLoading || !input.trim() ? 0.5 : 1 }} onMouseEnter={(e) => e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #F5D547 0%, #E6B325 100%)'} onMouseLeave={(e) => e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #E6B325 0%, #D4A017 100%)'}>
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
            className="group relative text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ring-4 ring-white" style={{ backgroundColor: '#2D2B55', boxShadow: '0 16px 32px rgba(230, 179, 37, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E6B325'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2D2B55'}>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            <MessageCircle size={28} />
            <span className="absolute right-full mr-6 px-4 py-2 rounded-xl text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap pointer-events-none" style={{ backgroundColor: '#3D3B65', color: '#F5F5F7' }}>
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