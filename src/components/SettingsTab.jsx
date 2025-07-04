import React, { useState, useEffect } from 'react';
import { Settings, Bot, Server, Save, TestTube } from 'lucide-react';

const SettingsTab = () => {
  const [activeTab, setActiveTab] = useState('ai');
  const [settings, setSettings] = useState({
    openaiKey: '',
    openaiModel: 'gpt-4',
    haloUrl: '',
    clientId: '',
    clientSecret: '',
    accessToken: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    chrome.storage.local.get([
      'openaiKey', 'openaiModel', 'haloUrl', 'clientId', 'clientSecret', 'accessToken'
    ], (result) => {
      setSettings({
        openaiKey: result.openaiKey || '',
        openaiModel: result.openaiModel || 'gpt-4',
        haloUrl: result.haloUrl || '',
        clientId: result.clientId || '',
        clientSecret: result.clientSecret || '',
        accessToken: result.accessToken || ''
      });
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    chrome.storage.local.set(settings, () => {
      setIsSaving(false);
      setTestResult({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setTestResult(null), 3000);
    });
  };

  const testHaloConnection = async () => {
    if (!settings.haloUrl || !settings.accessToken) {
      setTestResult({ type: 'error', message: 'Missing HaloPSA URL or access token' });
      return;
    }

    try {
      const response = await fetch(`${settings.haloUrl}/api/ClientCache`, {
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({ 
          type: 'success', 
          message: `Connected successfully! User: ${data.user?.name || 'Unknown'}` 
        });
      } else {
        setTestResult({ 
          type: 'error', 
          message: `Connection failed: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        type: 'error', 
        message: `Connection error: ${error.message}` 
      });
    }
  };

  const testOpenAI = async () => {
    if (!settings.openaiKey) {
      setTestResult({ type: 'error', message: 'Missing OpenAI API key' });
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${settings.openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTestResult({ 
          type: 'success', 
          message: 'OpenAI API key is valid!' 
        });
      } else {
        setTestResult({ 
          type: 'error', 
          message: `OpenAI API test failed: ${response.status}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        type: 'error', 
        message: `OpenAI API error: ${error.message}` 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bot className="w-4 h-4 inline mr-2" />
              AI Settings
            </button>
            <button
              onClick={() => setActiveTab('halo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'halo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Server className="w-4 h-4 inline mr-2" />
              HaloPSA Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">OpenAI Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={settings.openaiKey}
                      onChange={(e) => setSettings({...settings, openaiKey: e.target.value})}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <select
                      value={settings.openaiModel}
                      onChange={(e) => setSettings({...settings, openaiModel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  <button
                    onClick={testOpenAI}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <TestTube className="w-4 h-4 inline mr-2" />
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'halo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">HaloPSA Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Server URL
                    </label>
                    <input
                      type="url"
                      value={settings.haloUrl}
                      onChange={(e) => setSettings({...settings, haloUrl: e.target.value})}
                      placeholder="https://your-domain.halopsa.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={settings.clientId}
                        onChange={(e) => setSettings({...settings, clientId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={settings.clientSecret}
                        onChange={(e) => setSettings({...settings, clientSecret: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {settings.accessToken && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Token Status
                      </label>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <span className="text-green-800 text-sm">✓ Connected</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={testHaloConnection}
                    disabled={!settings.accessToken}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <TestTube className="w-4 h-4 inline mr-2" />
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {testResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              testResult.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult.message}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;