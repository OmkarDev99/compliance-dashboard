import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/chat';
import ChatMessage from './ChatMessage';
import Loader from './Loader';
import toast from 'react-hot-toast';

const ChatBox = () => {
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: 'Hello. Ask me to find regulatory publications, circulars, filing guidance, or compliance requirements. I will return source-backed matches with original links.',
      type: 'bot',
      sources: [],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      toast.error('Please enter a question');
      return;
    }

    // Add user message
    const userMessage = {
      id: messages.length,
      text: inputValue,
      type: 'user',
      sources: [],
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(inputValue);

      const botMessage = {
        id: messages.length + 1,
        text: response.answer,
        type: 'bot',
        sources: response.sources || [],
        confidence: response.confidence,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast.error(error.message || 'Failed to get response from chatbot');
      const errorMessage = {
        id: messages.length + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        type: 'bot',
        sources: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="premium-card flex h-full flex-col overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
        {messages.map((message) => (
          <div key={message.id}>
            <ChatMessage message={message.text} type={message.type} />
            {message.sources && message.sources.length > 0 && (
              <div className="ml-2 mt-2">
                <p className="text-xs text-gray-500 font-semibold mb-2">Sources:</p>
                <div className="space-y-1">
                  {message.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block"
                    >
                      [{idx + 1}] {source.title} ({source.date})
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
              <Loader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about compliance rules..."
            rows="2"
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="premium-button-primary h-11 px-5 disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
