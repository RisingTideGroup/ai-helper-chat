import React, { useState, useEffect } from 'react';
import { Shield, Server, Key, CheckCircle, AlertCircle } from 'lucide-react';

const AuthScreen = ({ onAuthSuccess }) => {
  const [haloUrl, setHaloUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    // Load saved settings
    chrome.storage.local.get(['haloUrl', 'clientId', 'clientSecret'], (result) => {
      setHaloUrl(result.haloUrl || '');
      setClientId(result.clientId || '');
      setClientSecret(result.clientSecret || '');
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.local.set({ haloUrl, clientId, clientSecret });
  };

  const startOAuthFlow = async () => {
    if (!haloUrl || !clientId || !clientSecret) {
      setConnectionStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(null);
    
    try {
      // Save settings first
      console.log('Saving settings:', { haloUrl, clientId, clientSecret });
      saveSettings();
      
      const state = crypto.randomUUID();
      const codeVerifier = [...crypto.getRandomValues(new Uint8Array(32))]
        .map(x => x.toString(16).padStart(2, '0')).join('');
      const codeChallenge = await sha256Challenge(codeVerifier);

      const cleanedHaloUrl = haloUrl.replace(/\/+$/, '');
      console.log('Cleaned Halo URL:', cleanedHaloUrl);
      const authUrl = `${cleanedHaloUrl}/auth/authorize?` + new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: chrome.identity.getRedirectURL('oauth2'),
        scope: 'all:standard',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      }).toString();
      console.log('OAuth Authorization URL:', authUrl);
      chrome.storage.local.set({ 
        oauth_code_verifier: codeVerifier, 
        oauth_state: state 
      });
      console.log('1st Redirect URL:', chrome.identity.getRedirectURL('oauth2'));

      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        async (redirectUrl) => {
          console.log('Redirect URL:', redirectUrl);
          if (chrome.runtime.lastError) {
            setConnectionStatus({ 
              type: 'error', 
              message: 'OAuth failed: ' + chrome.runtime.lastError.message 
            });
            setIsConnecting(false);
            return;
          }

          try {
            const url = new URL(redirectUrl);
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');

            const items = await new Promise(resolve => 
              chrome.storage.local.get(['oauth_state', 'oauth_code_verifier'], resolve)
            );

            if (items.oauth_state !== returnedState) {
              throw new Error('OAuth state mismatch');
            }

            const tokenRes = await fetch(`${haloUrl}/auth/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: chrome.identity.getRedirectURL('oauth2'),
                client_id: clientId,
                client_secret: clientSecret,
                code_verifier: items.oauth_code_verifier
              })
            });

            const tokenData = await tokenRes.json();
            
            if (!tokenData.access_token) {
              throw new Error('Failed to obtain access token');
            }

            chrome.storage.local.set({ 
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              tokenExpiry: Date.now() + (tokenData.expires_in * 1000)
            });

            setConnectionStatus({ 
              type: 'success', 
              message: 'Successfully connected to HaloPSA!' 
            });
            
            setTimeout(() => onAuthSuccess(), 1500);
          } catch (error) {
            setConnectionStatus({ 
              type: 'error', 
              message: error.message 
            });
          } finally {
            setIsConnecting(false);
          }
        }
      );
    } catch (error) {
      setConnectionStatus({ 
        type: 'error', 
        message: error.message 
      });
      setIsConnecting(false);
    }
  };

  async function sha256Challenge(verifier) {
    const enc = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect to HaloPSA</h1>
          <p className="text-gray-600">Enter your HaloPSA server details to get started</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Server className="w-4 h-4 inline mr-2" />
              HaloPSA URL
            </label>
            <input
              type="url"
              value={haloUrl}
              onChange={(e) => setHaloUrl(e.target.value)}
              placeholder="https://your-domain.halopsa.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-2" />
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Your OAuth Client ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-2" />
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Your OAuth Client Secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {connectionStatus && (
            <div className={`p-3 rounded-lg flex items-center ${
              connectionStatus.type === 'success' 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {connectionStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {connectionStatus.message}
            </div>
          )}

          <button
            onClick={startOAuthFlow}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Connect to HaloPSA'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help setting up OAuth? Check the HaloPSA documentation for creating OAuth applications.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;