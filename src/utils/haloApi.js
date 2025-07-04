export class HaloAPI {
  constructor() {
    this.baseUrl = '';
    this.accessToken = '';
  }

  async initialize() {
    const settings = await new Promise(resolve =>
      chrome.storage.local.get(['haloUrl', 'accessToken'], resolve)
    );
    
    this.baseUrl = settings.haloUrl;
    this.accessToken = settings.accessToken;
    
    if (!this.baseUrl || !this.accessToken) {
      throw new Error('HaloPSA connection not configured');
    }
  }

  async makeRequest(endpoint, options = {}) {
    await this.initialize();
    
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshToken();
        // Retry the request
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, config);
        if (!retryResponse.ok) {
          throw new Error(`HaloPSA API error: ${retryResponse.status}`);
        }
        return await retryResponse.json();
      }
      throw new Error(`HaloPSA API error: ${response.status}`);
    }
    
    return await response.json();
  }

  async refreshToken() {
    const settings = await new Promise(resolve =>
      chrome.storage.local.get(['haloUrl', 'clientId', 'clientSecret', 'refreshToken'], resolve)
    );

    if (!settings.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${settings.haloUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: settings.refreshToken,
        client_id: settings.clientId,
        client_secret: settings.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokenData = await response.json();
    
    chrome.storage.local.set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: Date.now() + (tokenData.expires_in * 1000)
    });

    this.accessToken = tokenData.access_token;
  }

  async executeFunction(functionDef, parameters = {}) {
    let endpoint = functionDef.endpoint;
    let body = functionDef.body ? { ...functionDef.body } : undefined;
    let params = functionDef.params ? { ...functionDef.params } : {};

    // Replace placeholders in endpoint
    Object.entries(parameters).forEach(([key, value]) => {
      endpoint = endpoint.replace(`{${key}}`, value);
      
      // Replace in body
      if (body) {
        Object.keys(body).forEach(bodyKey => {
          if (typeof body[bodyKey] === 'string') {
            body[bodyKey] = body[bodyKey].replace(`{${key}}`, value);
          }
        });
      }
      
      // Replace in params
      Object.keys(params).forEach(paramKey => {
        if (typeof params[paramKey] === 'string') {
          params[paramKey] = params[paramKey].replace(`{${key}}`, value);
        }
      });
    });

    // Build query string for GET requests
    if (functionDef.method === 'GET' && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      endpoint += `?${queryString}`;
    }

    const options = {
      method: functionDef.method,
      headers: functionDef.headers || {}
    };

    if (body && (functionDef.method === 'POST' || functionDef.method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    return await this.makeRequest(endpoint, options);
  }

  // Convenience methods for common operations
  async getTickets(filters = {}) {
    return await this.makeRequest('/api/tickets', {
      method: 'GET'
    });
  }

  async getClients() {
    return await this.makeRequest('/api/clients', {
      method: 'GET'
    });
  }

  async getUsers() {
    return await this.makeRequest('/api/users', {
      method: 'GET'
    });
  }

  async createTicket(ticketData) {
    return await this.makeRequest('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }
}

export const haloApi = new HaloAPI();