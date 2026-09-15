(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var chatbotId = script.getAttribute("data-chatbot-id");
  var scriptUrl;
  try {
    scriptUrl = new URL(script.src, document.baseURI);
  } catch (_) {
    return;
  }
  var apiBase = scriptUrl.origin;
  var storageKey = "aicsp_widget_visitor_id";
  var visitorId;

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "visitor-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  try {
    visitorId = window.sessionStorage.getItem(storageKey);
    if (!visitorId) {
      visitorId = randomId();
      window.sessionStorage.setItem(storageKey, visitorId);
    }
  } catch (_) {
    visitorId = randomId();
  }

  var host = document.createElement("div");
  host.setAttribute("data-aicsp-widget", "");
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = [
    ":host{--aicsp-primary:#7c3aed;all:initial}",
    "*{box-sizing:border-box}",
    ".wrap{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:Inter,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#172033;line-height:1.4}",
    ".bubble{display:grid;place-items:center;width:58px;height:58px;margin-left:auto;border:0;border-radius:50%;background:var(--aicsp-primary);color:#fff;cursor:pointer;box-shadow:0 12px 30px rgba(15,23,42,.28);transition:transform .18s ease;outline:none}",
    ".bubble:hover{transform:translateY(-2px)}.bubble:focus-visible{box-shadow:0 0 0 4px rgba(255,255,255,.9),0 0 0 7px var(--aicsp-primary)}",
    ".panel{display:none;flex-direction:column;width:min(370px,calc(100vw - 32px));height:min(560px,calc(100vh - 100px));margin-bottom:14px;overflow:hidden;border:1px solid rgba(15,23,42,.1);border-radius:18px;background:#fff;box-shadow:0 22px 65px rgba(15,23,42,.25)}",
    ".panel.open{display:flex}.header{display:flex;align-items:center;gap:11px;min-height:70px;padding:14px 16px;background:var(--aicsp-primary);color:#fff}",
    ".avatar{display:grid;place-items:center;width:40px;height:40px;flex:none;overflow:hidden;border-radius:12px;background:rgba(255,255,255,.18);font-weight:700}.avatar img{width:100%;height:100%;object-fit:cover}",
    ".title{min-width:0;flex:1}.name{overflow:hidden;font-size:15px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.status{margin-top:2px;font-size:11px;opacity:.82}",
    ".close{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:9px;background:transparent;color:#fff;cursor:pointer}.close:hover{background:rgba(255,255,255,.13)}",
    ".messages{flex:1;overflow-y:auto;padding:18px;background:#f7f8fb}.row{display:flex;margin:0 0 12px}.row.user{justify-content:flex-end}.msg{max-width:82%;padding:10px 13px;border-radius:15px;background:#fff;color:#263247;font-size:14px;white-space:pre-wrap;word-break:break-word;box-shadow:0 1px 2px rgba(15,23,42,.07)}",
    ".row.user .msg{background:var(--aicsp-primary);color:#fff;border-bottom-right-radius:5px}.row.bot .msg{border-bottom-left-radius:5px}.msg.error{color:#9f1239;background:#fff1f2}.typing{color:#64748b;font-style:italic}",
    ".form{display:flex;gap:9px;padding:13px;border-top:1px solid #e8ebf1;background:#fff}.input{min-width:0;flex:1;border:1px solid #d8dde7;border-radius:11px;padding:10px 12px;background:#fff;color:#172033;font:inherit;font-size:14px;outline:none}.input:focus{border-color:var(--aicsp-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--aicsp-primary) 14%,transparent)}",
    ".send{display:grid;place-items:center;width:42px;height:42px;flex:none;border:0;border-radius:11px;background:var(--aicsp-primary);color:#fff;cursor:pointer}.send:disabled,.input:disabled{cursor:not-allowed;opacity:.55}",
    "@media(max-width:480px){.wrap{right:16px;bottom:16px}.panel{height:min(540px,calc(100vh - 92px))}}",
    "@media(prefers-reduced-motion:reduce){.bubble{transition:none}}"
  ].join("");
  root.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.innerHTML = '<section class="panel" role="dialog" aria-label="Customer support chat"><header class="header"><div class="avatar" aria-hidden="true"><span>AI</span></div><div class="title"><div class="name">Customer Support</div><div class="status">Typically replies instantly</div></div><button class="close" type="button" aria-label="Close chat">&#10005;</button></header><div class="messages" aria-live="polite"></div><form class="form"><input class="input" aria-label="Message" placeholder="Type your message…" autocomplete="off"><button class="send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg></button></form></section><button class="bubble" type="button" aria-label="Open customer support chat" aria-expanded="false"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg></button>';
  root.appendChild(wrap);

  var panel = wrap.querySelector(".panel");
  var bubble = wrap.querySelector(".bubble");
  var closeButton = wrap.querySelector(".close");
  var messages = wrap.querySelector(".messages");
  var form = wrap.querySelector(".form");
  var input = wrap.querySelector(".input");
  var sendButton = wrap.querySelector(".send");
  var nameNode = wrap.querySelector(".name");
  var avatar = wrap.querySelector(".avatar");
  var available = false;
  var sending = false;
  input.disabled = true;
  sendButton.disabled = true;

  function addMessage(role, text, extraClass) {
    var row = document.createElement("div");
    row.className = "row " + role;
    var message = document.createElement("div");
    message.className = "msg" + (extraClass ? " " + extraClass : "");
    message.textContent = text;
    row.appendChild(message);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function setOpen(open) {
    panel.classList.toggle("open", open);
    bubble.setAttribute("aria-expanded", String(open));
    bubble.setAttribute("aria-label", open ? "Close customer support chat" : "Open customer support chat");
    if (open && available) window.setTimeout(function () { input.focus(); }, 0);
  }

  bubble.addEventListener("click", function () { setOpen(!panel.classList.contains("open")); });
  closeButton.addEventListener("click", function () { setOpen(false); bubble.focus(); });

  function unavailable() {
    available = false;
    input.disabled = true;
    sendButton.disabled = true;
    messages.textContent = "";
    addMessage("bot", "Chat is currently unavailable", "error");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text || !available || sending) return;
    sending = true;
    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;
    addMessage("user", text);
    var loading = addMessage("bot", "Thinking…", "typing");

    fetch(apiBase + "/chatbots/" + encodeURIComponent(chatbotId) + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_identifier: visitorId, message: text })
    }).then(function (response) {
      if (!response.ok) throw new Error("Chat request failed");
      return response.json();
    }).then(function (data) {
      loading.remove();
      addMessage("bot", data.reply || "Something went wrong, please try again", data.reply ? "" : "error");
    }).catch(function () {
      loading.remove();
      addMessage("bot", "Something went wrong, please try again", "error");
    }).then(function () {
      sending = false;
      input.disabled = !available;
      sendButton.disabled = !available;
      if (available) input.focus();
    });
  });

  if (!chatbotId) {
    unavailable();
    return;
  }

  fetch(apiBase + "/chatbots/" + encodeURIComponent(chatbotId) + "/public-config")
    .then(function (response) {
      if (!response.ok) throw new Error("Configuration request failed");
      return response.json();
    }).then(function (config) {
      nameNode.textContent = config.name || "Customer Support";
      if (config.primary_color && window.CSS && CSS.supports("color", config.primary_color)) {
        host.style.setProperty("--aicsp-primary", config.primary_color);
      }
      if (config.logo_url) {
        var image = document.createElement("img");
        image.src = config.logo_url;
        image.alt = "";
        image.addEventListener("error", function () { image.remove(); });
        avatar.textContent = "";
        avatar.appendChild(image);
      }
      available = true;
      input.disabled = false;
      sendButton.disabled = false;
      addMessage("bot", config.welcome_message || "Hi! How can I help you today?");
    }).catch(unavailable);
}());
