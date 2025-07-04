import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Upload, Globe, Save, X } from 'lucide-react';

const FunctionManager = () => {
  const [functions, setFunctions] = useState([]);
  const [customFunctions, setCustomFunctions] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFunction, setEditingFunction] = useState(null);
  const [importUrl, setImportUrl] = useState('');

  const [functionForm, setFunctionForm] = useState({
    name: '',
    description: '',
    method: 'GET',
    endpoint: '',
    headers: {},
    params: {},
    body: {}
  });

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    // Load built-in functions
    try {
      const builtInResponse = await fetch(chrome.runtime.getURL('functions/default_functions.json'));
      const builtIn = await builtInResponse.json();
      setFunctions(builtIn);
    } catch (error) {
      console.error('Failed to load built-in functions:', error);
      setFunctions([]);
    }

    // Load custom functions
    chrome.storage.local.get(['customFunctions'], (result) => {
      try {
        const custom = JSON.parse(result.customFunctions || '[]');
        setCustomFunctions(custom);
      } catch (error) {
        console.error('Failed to parse custom functions:', error);
        setCustomFunctions([]);
      }
    });
  };

  const saveCustomFunctions = (funcList) => {
    chrome.storage.local.set({ customFunctions: JSON.stringify(funcList) });
    setCustomFunctions(funcList);
  };

  const handleCreateFunction = () => {
    setEditingFunction(null);
    setFunctionForm({
      name: '',
      description: '',
      method: 'GET',
      endpoint: '',
      headers: {},
      params: {},
      body: {}
    });
    setShowEditor(true);
  };

  const handleEditFunction = (func) => {
    setEditingFunction(func);
    setFunctionForm({
      name: func.name,
      description: func.description,
      method: func.method,
      endpoint: func.endpoint,
      headers: func.headers || {},
      params: func.params || {},
      body: func.body || {}
    });
    setShowEditor(true);
  };

  const handleSaveFunction = () => {
    const newFunction = { ...functionForm };
    
    if (editingFunction) {
      // Update existing function
      const updatedFunctions = customFunctions.map(f => 
        f.name === editingFunction.name ? newFunction : f
      );
      saveCustomFunctions(updatedFunctions);
    } else {
      // Add new function
      saveCustomFunctions([...customFunctions, newFunction]);
    }
    
    setShowEditor(false);
  };

  const handleDeleteFunction = (funcName) => {
    if (confirm(`Are you sure you want to delete "${funcName}"?`)) {
      const updatedFunctions = customFunctions.filter(f => f.name !== funcName);
      saveCustomFunctions(updatedFunctions);
    }
  };

  const handleExport = () => {
    const exportData = {
      version: "1.0",
      functions: customFunctions,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'halopsa-functions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const functionsToImport = data.functions || data;
      
      if (!Array.isArray(functionsToImport)) {
        throw new Error('Invalid format: expected array of functions');
      }

      const validFunctions = functionsToImport.filter(f => 
        f.name && f.endpoint && f.method
      );

      saveCustomFunctions([...customFunctions, ...validFunctions]);
      alert(`Imported ${validFunctions.length} functions successfully!`);
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl) return;

    try {
      const response = await fetch(importUrl);
      const data = await response.json();
      const functionsToImport = data.functions || data;
      
      if (!Array.isArray(functionsToImport)) {
        throw new Error('Invalid format: expected array of functions');
      }

      const validFunctions = functionsToImport.filter(f => 
        f.name && f.endpoint && f.method
      );

      saveCustomFunctions([...customFunctions, ...validFunctions]);
      alert(`Imported ${validFunctions.length} functions from URL!`);
      setImportUrl('');
    } catch (error) {
      alert(`URL import failed: ${error.message}`);
    }
  };

  const updateFormObject = (field, key, value) => {
    setFunctionForm(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value
      }
    }));
  };

  const removeFromFormObject = (field, key) => {
    setFunctionForm(prev => {
      const newObj = { ...prev[field] };
      delete newObj[key];
      return { ...prev, [field]: newObj };
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Function Manager</h2>
            <div className="flex space-x-3">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Import File
              </label>
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              <button
                onClick={handleCreateFunction}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Function
              </button>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Import from URL (JSON)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleImportUrl}
              disabled={!importUrl}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Import URL
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Built-in Functions</h3>
              <div className="space-y-3">
                {functions.map((func, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{func.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{func.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            func.method === 'GET' ? 'bg-green-100 text-green-800' :
                            func.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            func.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {func.method}
                          </span>
                          <span className="text-xs text-gray-500">{func.endpoint}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Functions</h3>
              <div className="space-y-3">
                {customFunctions.map((func, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{func.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{func.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            func.method === 'GET' ? 'bg-green-100 text-green-800' :
                            func.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            func.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {func.method}
                          </span>
                          <span className="text-xs text-gray-500">{func.endpoint}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditFunction(func)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFunction(func.name)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {customFunctions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No custom functions yet. Create one to get started!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingFunction ? 'Edit Function' : 'Create New Function'}
                </h3>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Function Name
                  </label>
                  <input
                    type="text"
                    value={functionForm.name}
                    onChange={(e) => setFunctionForm({...functionForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method
                  </label>
                  <select
                    value={functionForm.method}
                    onChange={(e) => setFunctionForm({...functionForm, method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={functionForm.description}
                  onChange={(e) => setFunctionForm({...functionForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={functionForm.endpoint}
                  onChange={(e) => setFunctionForm({...functionForm, endpoint: e.target.value})}
                  placeholder="/api/tickets"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headers
                  </label>
                  <div className="space-y-2">
                    {Object.entries(functionForm.headers).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newHeaders = { ...functionForm.headers };
                            delete newHeaders[key];
                            newHeaders[e.target.value] = value;
                            setFunctionForm({...functionForm, headers: newHeaders});
                          }}
                          placeholder="Header name"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateFormObject('headers', key, e.target.value)}
                          placeholder="Header value"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => removeFromFormObject('headers', key)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateFormObject('headers', '', '')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Header
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parameters
                  </label>
                  <div className="space-y-2">
                    {Object.entries(functionForm.params).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newParams = { ...functionForm.params };
                            delete newParams[key];
                            newParams[e.target.value] = value;
                            setFunctionForm({...functionForm, params: newParams});
                          }}
                          placeholder="Param name"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateFormObject('params', key, e.target.value)}
                          placeholder="Param value"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => removeFromFormObject('params', key)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateFormObject('params', '', '')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Parameter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body (JSON)
                  </label>
                  <div className="space-y-2">
                    {Object.entries(functionForm.body).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newBody = { ...functionForm.body };
                            delete newBody[key];
                            newBody[e.target.value] = value;
                            setFunctionForm({...functionForm, body: newBody});
                          }}
                          placeholder="Field name"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateFormObject('body', key, e.target.value)}
                          placeholder="Field value"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => removeFromFormObject('body', key)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateFormObject('body', '', '')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Body Field
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFunction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Function
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionManager;