import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Sparkles, Zap, Bot, ChevronDown, Loader2, BookOpen, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANSI_CODES } from '../constants';

// Static Knowledge Base
const KNOWLEDGE_BASE = [
    { keywords: ['coordination', 'grade', 'grading', 'margin', 'interval'], response: "Protection coordination ensures the device closest to the fault trips first. A standard grading margin is 0.3 to 0.4 seconds between relays to account for breaker operation time and relay errors." },
    { keywords: ['ct', 'saturation', 'knee', 'point'], response: "CT Saturation occurs when the core flux density exceeds the design limit, causing the secondary current to be distorted and reduced. This can cause differential relays to misoperate or overcurrent relays to trip slowly." },
    { keywords: ['differential', '87', 'slope'], response: "Differential protection (87) works on Kirchhoff's law: Current In must equal Current Out. If the difference (Idiff) exceeds a set threshold (Slope), it trips. It is strictly for 'Unit Protection'." },
    { keywords: ['distance', '21', 'mho', 'impedance'], response: "Distance relays (21) measure Impedance (Z = V/I). If the measured Z is less than the reach setting, it trips. Zone 1 is typically set to 80% of the line length for instantaneous tripping." },
    { keywords: ['tms', 'tds', 'time dial'], response: "Time Multiplier Setting (TMS) or Time Dial Setting (TDS) shifts the inverse curve vertically. Increasing TMS increases the trip time for the same current, allowing for coordination with downstream devices." },
    { keywords: ['pickup', 'plug', 'setting'], response: "Pickup current is the threshold where the relay starts to operate. For overcurrent, this is typically set above maximum load current (e.g., 110-120%) but well below minimum fault current." },
    { keywords: ['tcc', 'curve'], response: "Time-Current Curves (TCC) log-log plots showing trip time vs current. IEC curves (Standard, Very, Extremely Inverse) are defined by formulas. 'Very Inverse' is common for steep coordination." },
    { keywords: ['failure', 'lab'], response: "The Failure Lab module allows you to simulate forensic scenarios like CT saturation or Distance Relay overreach due to high Source Impedance Ratios (SIR)." },
    { keywords: ['twin', 'digital'], response: "The Digital Twin module simulates power flow and fault propagation topology. It checks connectivity and energization status based on breaker positions." },
];

const AICoach = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
      { role: 'model', text: "Hello! I'm your Offline Engineering Guide. Ask me about ANSI codes (e.g., 'What is 51?'), coordination principles, or how to use the modules." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const generateResponse = (query: string) => {
      const lowerQ = query.toLowerCase();

      // 1. Check ANSI Codes directly
      const ansiMatch = ANSI_CODES.find(c => lowerQ.includes(c.code) || lowerQ.includes(c.name.toLowerCase()));
      if (ansiMatch) {
          return `**ANSI ${ansiMatch.code} - ${ansiMatch.name}**\n${ansiMatch.description}`;
      }

      // 2. Check Knowledge Base
      const knowledge = KNOWLEDGE_BASE.find(k => k.keywords.some(word => lowerQ.includes(word)));
      if (knowledge) {
          return knowledge.response;
      }

      // 3. Navigation Help
      if (lowerQ.includes('reset') || lowerQ.includes('clear')) {
          return "I can't control the app directly, but you can usually find a 'Reset' button in the toolbar of each module.";
      }

      // 4. Default Fallback
      return "I'm not sure about that specific term. Try asking about 'ANSI 51', 'Coordination', 'CT Saturation', or 'Distance Protection'. I operate fully offline with a built-in engineering library.";
  };

  const handleSend = async () => {
      if (!input.trim()) return;
      
      const userMsg = input;
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setInput('');
      setIsTyping(true);

      // Simulate "thinking" delay for natural feel
      setTimeout(() => {
          const responseText = generateResponse(userMsg);
          setMessages(prev => [...prev, { role: 'model', text: responseText }]);
          setIsTyping(false);
      }, 600);
  };

  return (
    <>
        {/* Floating Toggle Button */}
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-4 rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center border-2 border-white/10"
        >
            {isOpen ? <ChevronDown className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </motion.button>

        {/* Chat Window */}
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-24 right-6 z-50 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Engineering Guide</h3>
                            <p className="text-blue-100 text-xs flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Offline Expert
                            </p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="ml-auto text-white/80 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                                    m.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                             <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-2 items-center text-xs text-slate-500">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Searching Library...
                                </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2"
                        >
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about '51', 'Diff'..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white"
                            />
                            <button 
                                type="submit" 
                                disabled={isTyping || !input.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-lg transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};

export default AICoach;