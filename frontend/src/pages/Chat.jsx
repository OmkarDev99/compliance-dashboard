import React, { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox';
import { checkChatHealth } from '../services/chat';
import toast from 'react-hot-toast';

const Chat = () => {
  const [chatAvailable, setChatAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyChatService = async () => {
      try {
        await checkChatHealth();
        setChatAvailable(true);
      } catch (error) {
        setChatAvailable(false);
        toast.error('Chat service is unavailable. Please ensure the RAG service is running on port 8001.');
      } finally {
        setChecking(false);
      }
    };

    verifyChatService();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking chat service...</p>
        </div>
      </div>
    );
  }

  if (!chatAvailable) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-4">Chat Service Unavailable</h2>
          <p className="text-red-700 mb-4">
            The compliance chatbot service is not running. Please ensure:
          </p>
          <ul className="text-left text-red-600 space-y-2 mb-4">
            <li>✓ The RAG service is running on port 8001</li>
            <li>✓ Environment variable VITE_RAG_API_URL is set correctly</li>
            <li>✓ ChromaDB is populated with compliance data</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Assistant</h1>
        <p className="text-gray-600 mt-2">
          Ask any questions about ICSI and MCA compliance rules, regulations, and procedures
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 h-[600px]">
          <ChatBox />
        </div>

        {/* Sidebar - Info and Tips */}
        <div className="space-y-4">
          {/* Quick Tips */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Tips for better answers:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Be specific about your compliance question</li>
              <li>• Ask about specific rules or procedures</li>
              <li>• Include relevant dates or deadlines</li>
              <li>• One question at a time works best</li>
            </ul>
          </div>

          {/* Supported Topics */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Supported Topics:</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• Annual Compliance</li>
              <li>• Board Meetings</li>
              <li>• Director Duties</li>
              <li>• Financial Reporting</li>
              <li>• ICSI Regulations</li>
              <li>• MCA Guidelines</li>
            </ul>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Chat service is online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
