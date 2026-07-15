import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/chat';
import ChatMessage from './ChatMessage';
import Loader from './Loader';
import toast from 'react-hot-toast';

const ChatBox = () => {
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: 'Hello! I am your Compliance Assistant. Ask me any questions about ICSI and MCA compliance rules and regulations.',
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            <div className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
              <Loader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about compliance rules..."
            rows="3"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors h-fit"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
