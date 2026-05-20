/**
 * MCP Apps Bridge — Lightweight inline bridge for MCP App protocol.
 * Implements the JSON-RPC postMessage protocol between the dashboard iframe
 * and the MCP host (Claude Desktop, VS Code, ChatGPT, etc.).
 *
 * Protocol: https://modelcontextprotocol.io/extensions/apps
 * SDK: @modelcontextprotocol/ext-apps
 */
(function () {
  'use strict';
  if (window.__mcpBridge) return;

  var PROTOCOL_VERSION = '2026-01-26';
  var APP_NAME = 'japan-real-estate-intel';
  var APP_VERSION = '6.15.1';
  var nextId = 1;
  var pendingRequests = {};
  var hostCapabilities = null;
  var connected = false;

  var hostOrigin = '*';
  try {
    if (document.referrer) {
      var ref = new URL(document.referrer);
      hostOrigin = ref.origin;
    }
  } catch (_) {}

  function send(msg) {
    try { window.parent.postMessage(msg, hostOrigin); } catch (_) {
      try { window.parent.postMessage(msg, '*'); } catch (__) {}
    }
  }

  function sendRequest(method, params) {
    var id = nextId++;
    return new Promise(function (resolve, reject) {
      pendingRequests[id] = { resolve: resolve, reject: reject };
      send({ jsonrpc: '2.0', id: id, method: method, params: params || {} });
      setTimeout(function () {
        if (pendingRequests[id]) {
          delete pendingRequests[id];
          reject(new Error('MCP bridge request timeout: ' + method));
        }
      }, 30000);
    });
  }

  function sendNotification(method, params) {
    send({ jsonrpc: '2.0', method: method, params: params || {} });
  }

  /** Call a server-side MCP tool from the dashboard UI. */
  function callServerTool(name, args) {
    return sendRequest('tools/call', { name: name, arguments: args || {} });
  }

  /** Update the AI model's context about what the user is viewing. */
  function updateContext(data) {
    if (!hostCapabilities || hostCapabilities.updateModelContext === false) {
      return Promise.resolve({ ok: false, reason: 'host does not support updateModelContext' });
    }
    return sendRequest('ui/update-model-context', {
      content: [{ type: 'text', text: JSON.stringify(data) }],
      structuredContent: data || {}
    }).catch(function () {
      return { ok: false, reason: 'update-model-context rejected' };
    });
  }

  /** Send a message to the host chat. */
  function sendMessage(text) {
    if (!hostCapabilities || hostCapabilities.messaging === false) {
      return Promise.resolve({ ok: false, reason: 'host does not support messaging' });
    }
    return sendRequest('ui/message', {
      role: 'user',
      content: [{ type: 'text', text: text }]
    }).catch(function () {
      return { ok: false, reason: 'ui/message rejected' };
    });
  }

  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    var msg = event.data;
    if (msg.jsonrpc !== '2.0') return;

    if (msg.id !== undefined && msg.id !== null && !msg.method) {
      var pending = pendingRequests[msg.id];
      if (pending) {
        delete pendingRequests[msg.id];
        if (msg.error) {
          pending.reject(new Error(msg.error.message || 'RPC Error'));
        } else {
          pending.resolve(msg.result);
        }
      }
      return;
    }

    if (msg.method) {
      switch (msg.method) {
        case 'ui/notifications/tool-result':
          handleToolResult(msg.params);
          break;
        case 'ui/notifications/tool-input':
          handleToolInput(msg.params);
          break;
        case 'ui/notifications/tool-input-partial':
          break;
        case 'ui/notifications/tool-cancelled':
          break;
        case 'ui/notifications/host-context-changed':
          if (msg.params && msg.params.hostContext) {
            applyHostStyles(msg.params.hostContext);
          }
          break;
        case 'notifications/progress':
          handleProgress(msg.params);
          break;
        default:
          break;
      }
    }
  });

  function handleToolResult(params) {
    if (!params) return;
    var result = params.result || params;
    var structured = result.structuredContent;
    var content = result.content;
    var textPart = null;
    if (content && content.length) {
      for (var i = 0; i < content.length; i++) {
        if (content[i].type === 'text') {
          textPart = content[i].text;
          break;
        }
      }
    }

    var merged = {};
    if (textPart) {
      try {
        var parsed = JSON.parse(textPart);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.assign(merged, parsed);
        }
      } catch (_) {}
    }
    if (structured && typeof structured === 'object' && !Array.isArray(structured)) {
      Object.assign(merged, structured);
    }
    if (textPart && Object.keys(merged).length === 0) {
      merged = { rawText: textPart };
    }
    if (Object.keys(merged).length === 0) return;
    applyToolData(merged);
  }

  function handleToolInput(params) {
    if (!params || !params.arguments) return;
    var args = params.arguments;
    if (args.prefecture) {
      var prefSelect = document.getElementById('pref-select') || document.getElementById('prefecture-select');
      if (prefSelect && prefSelect.value !== args.prefecture) {
        prefSelect.value = args.prefecture;
        prefSelect.dispatchEvent(new Event('change'));
      }
    }
    if (args.area || args.city) {
      var citySelect = document.getElementById('area-select') || document.getElementById('city-select');
      if (citySelect) {
        citySelect.value = args.area || args.city;
        citySelect.dispatchEvent(new Event('change'));
      }
    }
  }

  function applyToolData(data) {
    if (data.prefecture) {
      var prefSelect = document.getElementById('pref-select') || document.getElementById('prefecture-select');
      if (prefSelect) {
        var prefKey = data.prefecture;
        if (prefSelect.querySelector('option[value="' + prefKey + '"]')) {
          prefSelect.value = prefKey;
          prefSelect.dispatchEvent(new Event('change'));
        }
      }
    }
    if (data.layer) {
      var layerBtns = document.querySelectorAll('.layer-btn');
      layerBtns.forEach(function (btn) {
        if (btn.getAttribute('data-layer') === data.layer) {
          btn.click();
        }
      });
    }
    if (data.mode === '3d') {
      if (typeof window.__currentMode !== 'undefined') {
        window.__currentMode = '3d';
      }
      var threeDBtn = document.querySelector('[data-mode="3d"]');
      if (threeDBtn) threeDBtn.click();
    }
    window.dispatchEvent(new CustomEvent('mcp-tool-data', { detail: data }));
  }

  var progressToast = null;
  var progressHideTimer = null;

  function getOrCreateProgressToast() {
    if (progressToast) return progressToast;
    progressToast = document.createElement('div');
    progressToast.id = 'mcp-progress-toast';
    progressToast.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;' +
      'background:linear-gradient(180deg,#141922 0%,#1a2230 100%);border-bottom:1px solid #3d4a5c;' +
      'box-shadow:0 6px 24px rgba(0,0,0,0.55);' +
      'padding:10px 16px;display:flex;align-items:center;gap:12px;font-size:12px;' +
      'color:#e4e8f1;transform:translateY(-100%);transition:transform .3s ease';
    progressToast.innerHTML =
      '<div id="mcp-progress-bar" style="flex:1;height:8px;border-radius:6px;overflow:hidden;' +
        'background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.14);' +
        'box-shadow:inset 0 1px 3px rgba(0,0,0,0.65)">' +
        '<div id="mcp-progress-fill" style="height:100%;width:0%;border-radius:5px;transition:width .3s;' +
        'background:linear-gradient(90deg,#3b7dff,#6ba0ff);box-shadow:0 0 12px rgba(79,140,255,0.55)"></div>' +
      '</div>' +
      '<span id="mcp-progress-label" style="white-space:nowrap;min-width:80px;font-weight:500;color:#f0f4fa"></span>';
    document.body.appendChild(progressToast);
    return progressToast;
  }

  function handleProgress(params) {
    if (!params) return;
    var progress = params.progress || 0;
    var total = params.total || 1;
    var message = params.message || '';
    var pct = Math.round((progress / total) * 100);
    var toast = getOrCreateProgressToast();
    var fill = document.getElementById('mcp-progress-fill');
    var label = document.getElementById('mcp-progress-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = progress + '/' + total + ' ' + message;
    toast.style.transform = 'translateY(0)';
    if (progressHideTimer) clearTimeout(progressHideTimer);
    if (progress >= total) {
      progressHideTimer = setTimeout(function () {
        toast.style.transform = 'translateY(-100%)';
      }, 2000);
    }
  }

  function applyHostStyles(ctx) {
    if (!ctx || !ctx.styles) return;
    var root = document.documentElement;
    var styles = ctx.styles.variables || ctx.styles;
    Object.keys(styles).forEach(function (key) {
      if (typeof styles[key] === 'string') root.style.setProperty(key, styles[key]);
    });
  }

  function initialize() {
    if (window.parent === window) return;

    sendRequest('ui/initialize', {
      appInfo: { name: APP_NAME, version: APP_VERSION },
      appCapabilities: {
        availableDisplayModes: ['inline'],
        supportsModelContextUpdates: true,
        supportsMessaging: true
      },
      protocolVersion: PROTOCOL_VERSION
    }).then(function (result) {
      connected = true;
      hostCapabilities = result.hostCapabilities || null;
      if (result.hostContext) applyHostStyles(result.hostContext);
      sendNotification('ui/notifications/initialized');
      window.dispatchEvent(new CustomEvent('mcp-connected', {
        detail: { hostInfo: result.hostInfo, capabilities: hostCapabilities }
      }));
    }).catch(function () {
      connected = false;
    });
  }

  window.__mcpBridge = {
    callServerTool: callServerTool,
    updateContext: updateContext,
    sendMessage: sendMessage,
    get connected() { return connected; },
    get hostCapabilities() { return hostCapabilities; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 0);
  }
})();
