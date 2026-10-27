import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ArrowRight, 
  User, 
  Building2, 
  MessageSquare,
  HelpCircle,
  Minimize2
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  related_lead_ids?: string[];
  suggested_actions?: any[];
}

export const AskLeadLoopDrawer: React.FC = () => {
  const { isAskAIOpen, setIsAskAIOpen, askLeadLoop, setSelectedLeadId, setCurrentView, openAIModal, leads } = useApp();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "👋 Hi, I'm **Ask LeadLoop**! I analyze your workspace leads, pipeline stages, overdue follow-ups, and risk signals in real-time. Ask me anything like:\n• *Which leads need follow-up today?*\n• *Which deals are at risk?*\n• *Show me my highest-value leads.*",
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askLeadLoop(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: response.answer,
          related_lead_ids: response.related_lead_ids,
          suggested_actions: response.suggested_actions,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I encountered an issue analyzing your CRM data. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'Which leads need follow-up today?',
    'Which deals are at risk?',
    'Show me my highest-value leads',
    'Summarize Rahul Sharma',
  ];

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isAskAIOpen && (
        <button
          onClick={() => setIsAskAIOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-300 hover:scale-105 transition-transform"
        >
          <Sparkles className="h-4 w-4 text-amber-200 animate-pulse" />
          <span>Ask LeadLoop</span>
        </button>
      )}

      {/* Floating Assistant Card */}
      {isAskAIOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-[94vw] sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-none">Ask LeadLoop</h4>
                <p className="text-[10px] text-indigo-100 mt-0.5">Workspace Sales Copilot</p>
              </div>
            </div>
            <button
              onClick={() => setIsAskAIOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/20 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Related Leads & Action Pills */}
                {msg.related_lead_ids && msg.related_lead_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
                    {msg.related_lead_ids.map((leadId) => {
                      const lead = leads.find((l) => l.id === leadId);
                      if (!lead) return null;
                      return (
                        <button
                          key={lead.id}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setCurrentView('lead-detail');
                            setIsAskAIOpen(false);
                          }}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                        >
                          <span>{lead.name}</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-indigo-950 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 border border-indigo-100 p-3 rounded-2xl w-fit shadow-xs animate-in fade-in">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Sparkles className="h-3 w-3 animate-spin" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-[11px] block">Synthesizing CRM insights...</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                    <span>Evaluating active pipeline & sentiment signals</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex gap-1.5 overflow-x-auto">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-slate-200 p-2.5 flex items-center gap-2 bg-white"
          >
            <input
              type="text"
              placeholder="Ask about leads, priorities, deal risk..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-40 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
