import React, { useState, useEffect } from 'react';
import AuthScreen from './AuthScreen';
import ChatInterface from './ChatInterface';
import SettingsTab from './SettingsTab';
import FunctionManager from './FunctionManager';

const MainApp = () => {
  const [currentView, setCurrentView] = useState('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    chrome.storage.local.get(['accessToken', 'tokenExpiry'], (result) => {
      const hasValidToken = result.accessToken && 
        result.tokenExpiry && 
        Date.now() < result.tokenExpiry;
      
      setIsAuthenticated(hasValidToken);
      setCurrentView(hasValidToken ? 'chat' : 'auth');
    });
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('chat');
  };

  const handleShowSettings = () => {
    setCurrentView('settings');
  };

  const handleShowFunctions = () => {
    setCurrentView('functions');
  };

  const handleShowChat = () => {
    setCurrentView('chat');
  };

  if (currentView === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      {currentView === 'auth' && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
      
      {currentView === 'chat' && (
        <ChatInterface 
          onShowSettings={handleShowSettings}
          onShowFunctions={handleShowFunctions}
        />
      )}
      
      {currentView === 'settings' && (
        <div>
          <div className="bg-white border-b border-gray-200 p-4">
            <button
              onClick={handleShowChat}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Chat
            </button>
          </div>
          <SettingsTab />
        </div>
      )}
      
      {currentView === 'functions' && (
        <div>
          <div className="bg-white border-b border-gray-200 p-4">
            <button
              onClick={handleShowChat}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Chat
            </button>
          </div>
          <FunctionManager />
        </div>
      )}
    </div>
  );
};

export default MainApp;