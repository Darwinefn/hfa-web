(function () {
  'use strict';

  var API = '/api/db';
  var STORAGE_KEY = 'hfa:chat';
  var session = null;
  var isAdmin = false;
  var visitorId = getVisitorId();
  var conversations = [];
  var activeId = '';
  var isOpen = false;
  var root;
  var refreshTimer;

  function readSession() {
    try { return JSON.parse(localStorage.getItem('hfa:session') || 'null'); }
    catch (error) { return null; }
  }

  function updateSession() {
    session = readSession();
    isAdmin = !!(session && session.role === 'admin');
  }

  function getVisitorId() {
    try {
      var id = localStorage.getItem('hfa:chatVisitorId');
      if (!id) {
        id = 'visitor-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('hfa:chatVisitorId', id);
      }
      return id;
    } catch (error) { return 'visitor-' + Math.random().toString(36).slice(2); }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function localConversations() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }

  async function loadConversations() {
    try {
      var response = await fetch(API + '?key=chat', { cache: 'no-store' });
      if (response.ok) {
        var result = await response.json();
        if (result.ok && typeof result.value === 'string') {
          var remote = JSON.parse(result.value);
          if (Array.isArray(remote)) {
            conversations = remote;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            return conversations;
          }
        }
      }
    } catch (error) {}
    conversations = localConversations();
    return conversations;
  }

  async function saveConversations() {
    var value = JSON.stringify(conversations);
    try { localStorage.setItem(STORAGE_KEY, value); } catch (error) {}
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'chat', value: value })
      });
    } catch (error) {}
  }

  function ownerId() {
    return session && session.username ? 'user:' + String(session.username).toLowerCase() : visitorId;
  }

  async function attachVisitorThreads() {
    if (!session || !session.username || isAdmin) return;
    var changed = false;
    conversations.forEach(function (conversation) {
      if (conversation.ownerId === visitorId) {
        conversation.ownerId = ownerId();
        if (conversation.ownerName === 'Visitante') conversation.ownerName = session.username;
        changed = true;
      }
    });
    if (changed) await saveConversations();
  }

  function currentConversation() {
    return conversations.find(function (conversation) { return conversation.id === activeId; }) || null;
  }

  function addMessage(conversation, sender, name, text) {
    conversation.messages.push({ sender: sender, name: name, text: text, at: new Date().toISOString() });
    conversation.updatedAt = new Date().toISOString();
  }

  function addStyles() {
    var style = document.createElement('style');
    style.textContent = '.hfa-chat-launcher{position:fixed;right:20px;bottom:20px;z-index:10000;border:0;border-radius:7px;padding:12px 16px;background:#34e88f;color:#07110b;font:700 13px Inter,Arial,sans-serif;box-shadow:0 8px 24px #0006;cursor:pointer}.hfa-chat-panel{position:fixed;right:20px;bottom:76px;z-index:10000;width:min(390px,calc(100vw - 28px));height:min(560px,calc(100vh - 110px));display:flex;flex-direction:column;overflow:hidden;border:1px solid #35463d;border-radius:9px;background:#101814;color:#edf5ef;font:13px Inter,Arial,sans-serif;box-shadow:0 18px 55px #0009}.hfa-chat-panel[hidden]{display:none}.hfa-chat-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:#17231c;border-bottom:1px solid #35463d}.hfa-chat-head strong{font-size:14px}.hfa-chat-head button,.hfa-chat-back{border:0;background:none;color:#b6c7bc;font-size:20px;cursor:pointer}.hfa-chat-body{display:flex;flex:1;min-height:0}.hfa-chat-list{width:100%;overflow:auto}.hfa-chat-item{display:block;width:100%;padding:13px 15px;border:0;border-bottom:1px solid #26342c;background:transparent;color:inherit;text-align:left;cursor:pointer}.hfa-chat-item:hover,.hfa-chat-item[aria-current=true]{background:#1c2b22}.hfa-chat-item strong,.hfa-chat-item span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hfa-chat-item span{margin-top:5px;color:#9eafa4;font-size:11px}.hfa-chat-empty{padding:22px 16px;color:#a6b6ac;line-height:1.5}.hfa-chat-thread{display:flex;flex:1;min-width:0;flex-direction:column}.hfa-chat-thread[hidden]{display:none}.hfa-chat-thread-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #26342c;color:#b5c6bb}.hfa-chat-messages{display:flex;flex:1;flex-direction:column;gap:9px;overflow:auto;padding:14px}.hfa-chat-message{max-width:86%;padding:9px 11px;border-radius:8px;background:#1c2a22;overflow-wrap:anywhere;line-height:1.45}.hfa-chat-message.mine{align-self:flex-end;background:#164b31}.hfa-chat-message small{display:block;margin-bottom:4px;color:#a7b9ad;font-size:10px}.hfa-chat-compose{display:flex;gap:8px;padding:11px;border-top:1px solid #26342c}.hfa-chat-compose textarea{flex:1;min-width:0;min-height:40px;max-height:100px;resize:vertical;padding:10px;border:1px solid #35463d;border-radius:6px;background:#0b110d;color:#edf5ef;font:inherit}.hfa-chat-compose button{border:0;border-radius:6px;padding:0 13px;background:#34e88f;color:#07110b;font-weight:700;cursor:pointer}@media(max-width:520px){.hfa-chat-launcher{right:14px;bottom:14px}.hfa-chat-panel{right:8px;bottom:68px;width:calc(100vw - 16px);height:min(560px,calc(100vh - 82px))}';
    document.head.appendChild(style);
  }

  function createUi() {
    addStyles();
    root = document.createElement('div');
    root.innerHTML = '<button class="hfa-chat-launcher" type="button">Ayuda</button><section class="hfa-chat-panel" aria-label="Chat de ayuda" hidden><header class="hfa-chat-head"><strong>Asistente de ayuda</strong><button type="button" data-chat-close aria-label="Cerrar">×</button></header><div class="hfa-chat-body"><div class="hfa-chat-list"></div><div class="hfa-chat-thread" hidden><div class="hfa-chat-thread-head"><button type="button" class="hfa-chat-back" data-chat-back aria-label="Volver">‹</button><span data-chat-title></span></div><div class="hfa-chat-messages" aria-live="polite"></div><form class="hfa-chat-compose"><textarea rows="1" maxlength="1000" placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje"></textarea><button type="submit">Enviar</button></form></div></div></section>';
    document.body.appendChild(root);
    root.addEventListener('click', handleClick);
    root.querySelector('.hfa-chat-compose').addEventListener('submit', sendMessage);
    root.querySelector('.hfa-chat-launcher').addEventListener('click', openInbox);
  }

  function renderList() {
    var list = root.querySelector('.hfa-chat-list');
    var visible = conversations.filter(function (conversation) { return isAdmin || conversation.ownerId === ownerId(); });
    visible.sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
    if (!visible.length) {
      list.innerHTML = '<div class="hfa-chat-empty">' + (isAdmin ? 'Aún no hay consultas.' : 'Cuéntanos qué necesitas y te responderá un administrador.') + '</div>';
      return;
    }
    list.innerHTML = visible.map(function (conversation) {
      var last = conversation.messages[conversation.messages.length - 1];
      return '<button type="button" class="hfa-chat-item" data-chat-open="' + escapeHtml(conversation.id) + '" aria-current="' + (conversation.id === activeId) + '"><strong>' + escapeHtml(isAdmin ? conversation.ownerName : 'Consulta de ayuda') + '</strong><span>' + escapeHtml(last ? last.text : 'Sin mensajes') + '</span></button>';
    }).join('');
  }

  function renderThread() {
    var conversation = currentConversation();
    var thread = root.querySelector('.hfa-chat-thread');
    var list = root.querySelector('.hfa-chat-list');
    if (!conversation) {
      thread.hidden = true;
      list.hidden = false;
      renderList();
      return;
    }
    list.hidden = true;
    thread.hidden = false;
    root.querySelector('[data-chat-title]').textContent = isAdmin ? conversation.ownerName : 'Administrador HFA';
    root.querySelector('.hfa-chat-messages').innerHTML = conversation.messages.map(function (message) {
      var mine = isAdmin ? message.sender === 'admin' : message.sender === 'user';
      return '<div class="hfa-chat-message' + (mine ? ' mine' : '') + '"><small>' + escapeHtml(message.name) + '</small>' + escapeHtml(message.text).replace(/\n/g, '<br>') + '</div>';
    }).join('');
    var messages = root.querySelector('.hfa-chat-messages');
    messages.scrollTop = messages.scrollHeight;
  }

  async function openInbox() {
    updateSession();
    root.querySelector('.hfa-chat-head strong').textContent = isAdmin ? 'Bandeja de ayuda' : 'Asistente de ayuda';
    root.querySelector('.hfa-chat-launcher').textContent = isAdmin ? 'Mensajes de ayuda' : 'Ayuda';
    isOpen = true;
    root.querySelector('.hfa-chat-panel').hidden = false;
    await loadConversations();
    await attachVisitorThreads();
    activeId = '';
    if (!isAdmin) {
      var own = conversations.filter(function (conversation) { return conversation.ownerId === ownerId(); });
      own.sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
      if (own.length) activeId = own[0].id;
      else {
        var conversation = { id: 'chat-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), ownerId: ownerId(), ownerName: String((session && session.username) || 'Visitante').slice(0, 60), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] };
        conversations.push(conversation);
        activeId = conversation.id;
        await saveConversations();
      }
    }
    renderThread();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refresh, 12000);
  }

  async function refresh() {
    if (!isOpen) return;
    await loadConversations();
    if (currentConversation()) renderThread();
    else renderList();
  }

  async function open(options) {
    options = options || {};
    updateSession();
    await loadConversations();
    await attachVisitorThreads();
    if (isAdmin) {
      isOpen = true;
      root.querySelector('.hfa-chat-panel').hidden = false;
      root.querySelector('.hfa-chat-head strong').textContent = 'Bandeja de ayuda';
      activeId = '';
      renderList();
      if (refreshTimer) clearInterval(refreshTimer);
      refreshTimer = setInterval(refresh, 12000);
      return;
    }
    var id = ownerId();
    var conversation = conversations.filter(function (item) { return item.ownerId === id; }).sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); })[0];
    if (!conversation) {
      conversation = { id: 'chat-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), ownerId: id, ownerName: String(options.name || (session && session.username) || 'Visitante').slice(0, 60), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] };
      conversations.push(conversation);
    }
    activeId = conversation.id;
    var prefill = String(options.prefill || '').trim();
    var last = conversation.messages[conversation.messages.length - 1];
    if (prefill && (!last || last.text !== prefill)) {
      addMessage(conversation, 'user', conversation.ownerName, prefill.slice(0, 1000));
      await saveConversations();
    }
    isOpen = true;
    root.querySelector('.hfa-chat-panel').hidden = false;
    root.querySelector('.hfa-chat-head strong').textContent = 'Asistente de ayuda';
    renderThread();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refresh, 12000);
  }

  async function sendMessage(event) {
    event.preventDefault();
    var input = root.querySelector('.hfa-chat-compose textarea');
    var text = input.value.trim();
    var conversation = currentConversation();
    if (!text || !conversation) return;
    addMessage(conversation, isAdmin ? 'admin' : 'user', isAdmin ? String(session.username || 'Administrador') : conversation.ownerName, text.slice(0, 1000));
    input.value = '';
    await saveConversations();
    renderThread();
  }

  function handleClick(event) {
    if (event.target.closest('[data-chat-close]')) {
      isOpen = false;
      root.querySelector('.hfa-chat-panel').hidden = true;
      clearInterval(refreshTimer);
      return;
    }
    if (event.target.closest('[data-chat-back]')) {
      activeId = '';
      renderList();
      root.querySelector('.hfa-chat-thread').hidden = true;
      root.querySelector('.hfa-chat-list').hidden = false;
      return;
    }
    var item = event.target.closest('[data-chat-open]');
    if (item) {
      activeId = item.dataset.chatOpen;
      renderThread();
    }
  }

  updateSession();
  createUi();
  window.HFAChat = { open: open };
})();
