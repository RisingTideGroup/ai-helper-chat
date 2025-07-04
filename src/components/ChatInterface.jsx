import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Settings, FunctionSquare as Functions, Loader } from 'lucide-react';

const ChatInterface = ({ onShowSettings, onShowFunctions }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if we have valid tokens
    chrome.storage.local.get(['accessToken', 'openaiKey'], (result) => {
      setIsConnected(result.accessToken && result.openaiKey);
    });

    // Add welcome message
    setMessages([{
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your HaloPSA assistant. I can help you query your PSA data, create tickets, and more. What would you like to know?',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get context from HaloPSA
      const context = await callHaloAPI(inputMessage);
      
      // Send to OpenAI
      const aiResponse = await sendToOpenAI(inputMessage, context);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const callHaloAPI = async (query) => {
    const { haloUrl, accessToken } = await new Promise(resolve =>
      chrome.storage.local.get(['haloUrl', 'accessToken'], resolve)
    );

    if (!haloUrl || !accessToken) {
      throw new Error('HaloPSA connection not configured');
    }

    // Simple query analysis to determine which API to call
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('ticket') || lowerQuery.includes('issue')) {
      // Fetch tickets
      const response = await fetch(`${haloUrl}/api/tickets?count=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HaloPSA API error: ${response.status}`);
      }
      
      return await response.json();
    } else if (lowerQuery.includes('client') || lowerQuery.includes('customer')) {
      // Fetch clients
      const response = await fetch(`${haloUrl}/api/clients?count=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HaloPSA API error: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // Default to user info
      const response = await fetch(`${haloUrl}/api/ClientCache`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HaloPSA API error: ${response.status}`);
      }
      
      return await response.json();
    }
  };

  const sendToOpenAI = async (query, context) => {
    const { openaiKey, openaiModel } = await new Promise(resolve =>
      chrome.storage.local.get(['openaiKey', 'openaiModel'], resolve)
    );

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: openaiModel || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for HaloPSA (Professional Services Automation). You help users understand and work with their PSA data. 
            
            When responding:
            - Be concise and helpful
            - Format data in a readable way
            - Suggest relevant actions when appropriate
            - If data seems incomplete, mention what additional information might be helpful
            
            The user's HaloPSA data context: ${JSON.stringify(context, null, 2)}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Required</h3>
          <p className="text-gray-600 mb-4">
            Please configure your HaloPSA connection and OpenAI API key to start chatting.
          </p>
          <button
            onClick={onShowSettings}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">HaloPSA Assistant</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onShowFunctions}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Manage Functions"
            >
              <Functions className="w-5 h-5" />
            </button>
            <button
              onClick={onShowSettings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && (
                  <Bot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <Loader className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your HaloPSA data..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;