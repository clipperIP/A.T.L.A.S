import React from 'react';
import { MessageSquare, Trash2, Volume2, Copy, Check, ChevronDown, Bot, User, ShieldAlert } from 'lucide-react';
import { ChatMessage } from '../types/atlas';

interface ConversationDrawerProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onReplayAudio: (text: string) => void;
}

export const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  messages,
  isOpen,
  onToggle,
  onClear,
  onReplayAudio,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 bg-[#040d1a]/95 border-t border-cyan-500/30 backdrop-blur-xl transition-all duration-300 flex flex-col ${
        isOpen ? 'h-[75vh] max-h-[640px]' : 'h-12'
      }`}
    >
      {/* Drawer Header Handle */}
      <div
        onClick={onToggle}
        className="h-12 px-4 flex items-center justify-between cursor-pointer hover:bg-cyan-950/30 transition-colors border-b border-cyan-500/15"
      >
        <div className="flex items-center gap-2 font-orbitron text-xs sm:text-sm text-cyan-300 font-semibold tracking-wider">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>CONVERSATION WITH J.A.R.V.I.S.</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 text-[10px] border border-cyan-500/30 font-mono-hud">
            {messages.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && messages.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Clear conversation history?')) {
                  onClear();
                }
              }}
              className="px-2 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] font-mono-hud flex items-center gap-1 hover:bg-red-900/50 transition-colors"
              title="Clear transcript"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR</span>
            </button>
          )}

          <ChevronDown
            className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 font-rajdhani">
              <Bot className="w-10 h-10 text-cyan-500/40 mb-2" />
              <div className="text-sm font-semibold text-slate-300">NO RECENT CONVERSATIONS</div>
              <div className="text-xs text-slate-500 max-w-xs mt-1">
                Say "Hey Jarvis" or tap below to start chatting with your AI companion.
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] font-mono-hud text-slate-400">
                  {msg.role === 'user' ? (
                    <>
                      <span>{msg.timestamp}</span>
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <User className="w-3 h-3" /> YOU
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-cyan-300 font-semibold flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-cyan-400" /> J.A.R.V.I.S.
                      </span>
                      {msg.source && (
                        <span className="px-1 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/30 text-[9px] text-cyan-400">
                          {msg.source}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed font-rajdhani tracking-wide relative group ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-950/80 to-sky-900/60 border border-cyan-500/40 text-cyan-50 rounded-tr-none'
                      : 'bg-gradient-to-b from-[#07152b] to-[#040e1e] border border-cyan-500/30 text-slate-200 rounded-tl-none shadow-[0_0_15px_rgba(0,240,255,0.08)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Action Buttons for Assistant Message */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cyan-500/15">
                      <button
                        onClick={() => onReplayAudio(msg.text)}
                        className="flex items-center gap-1 text-[11px] font-mono-hud text-cyan-400 hover:text-cyan-200 transition-colors"
                        title="Replay Voice Speech"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>REPLAY VOICE</span>
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 text-[11px] font-mono-hud text-slate-400 hover:text-slate-200 transition-colors ml-auto"
                        title="Copy Text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
