const state = {
  tickets: [],
  ticket: null,
  offset: 0,
  loading: false,
  hasMore: true,
  requestVersion: 0,
};
const pageSize = 20;
const $ = (id) => document.getElementById(id);
const ticketList = $("ticket-list");
const messageList = $("message-list");
const header = $("thread-header");
const input = $("message-input");
const form = $("message-form");
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
const formatDate = (value) => new Date(value).toLocaleString();
function subscribe() {
  if (state.ticket && window.notifSocket?.readyState === WebSocket.OPEN)
    window.notifSocket.send(
      JSON.stringify({ type: "subscribe_chat", ticketId: state.ticket.id }),
    );
}
function renderTickets() {
  ticketList.innerHTML = state.tickets.length
    ? state.tickets
        .map(
          (ticket) =>
            `<button type="button" data-id="${ticket.id}" class="ticket-row w-full border-b border-slate-100 p-4 text-left transition hover:bg-blue-50 ${state.ticket?.id === ticket.id ? "bg-blue-50 ring-inset ring-2 ring-blue-100" : ""}"><div class="flex items-start justify-between gap-3"><strong class="truncate text-sm text-[#0B2D4A]">${escapeHtml(ticket.title)}</strong><span class="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">${escapeHtml(ticket.type)}</span></div><p class="mt-2 text-xs text-slate-500">Created by ${escapeHtml(ticket.creatorName || "You")}</p><p class="mt-1 text-xs text-slate-400">${escapeHtml(ticket.answeredByName || "Unanswered")} · ${formatDate(ticket.createdAt)}</p></button>`,
        )
        .join("")
    : '<p class="p-5 text-sm text-slate-500">No tickets yet.</p>';
}
function renderMessage(message) {
  const staff = message.senderRole === "admin";
  return `<div data-message-id="${message.id}" class="flex ${staff ? "justify-start" : "justify-end"}"><div class="max-w-[82%]"><p class="mb-1 text-[10px] font-semibold text-slate-400">${escapeHtml(message.senderName || message.senderRole)}</p><div class="chat-new-message ${staff ? "chat-new-message--staff" : "chat-new-message--user"}">${escapeHtml(message.text)}</div><p class="mt-1 text-[10px] text-slate-400">${formatDate(message.createdAt)}</p></div></div>`;
}
function appendMessages(messages, prepend = false) {
  const html = messages.map(renderMessage).join("");
  if (prepend) {
    const old = messageList.scrollHeight;
    messageList.insertAdjacentHTML("afterbegin", html);
    messageList.scrollTop += messageList.scrollHeight - old;
  } else messageList.insertAdjacentHTML("beforeend", html);
}
async function loadMessages(older = false) {
  if (!state.ticket || state.loading || (!state.hasMore && older)) return;
  state.loading = true;
  const id = state.ticket.id;
  const version = ++state.requestVersion;
  const offset = older ? state.offset + pageSize : 0;
  try {
    const response = await fetch(
      `/account/api/tickets/${id}/messages?limit=${pageSize}&offset=${offset}`,
    );
    if (!response.ok) throw new Error("Unable to load messages.");
    const data = await response.json();
    if (version !== state.requestVersion || state.ticket?.id !== id) return;
    if (!older) messageList.innerHTML = "";
    appendMessages(data.messages, older);
    state.offset = offset;
    state.hasMore = data.messages.length === pageSize;
    if (!older) messageList.scrollTop = messageList.scrollHeight;
    subscribe();
  } catch (error) {
    messageList.innerHTML = `<p class="p-5 text-sm text-red-600">${escapeHtml(error.message)}</p>`;
  } finally {
    state.loading = false;
  }
}
async function selectTicket(id) {
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) return;
  state.ticket = ticket;
  state.offset = 0;
  state.hasMore = true;
  header.innerHTML = `<div class="flex items-center justify-between"><div><h2 class="font-bold text-[#0B2D4A]">${escapeHtml(ticket.title)}</h2><p class="mt-1 text-xs text-slate-500">${escapeHtml(ticket.type)} · ${formatDate(ticket.createdAt)}</p></div><span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">${escapeHtml(ticket.answeredByName || "Open")}</span></div>`;
  input.disabled = false;
  form.querySelector("button").disabled = false;
  renderTickets();
  await loadMessages();
}
async function loadTickets() {
  const response = await fetch("/account/api/tickets");
  if (!response.ok) throw new Error("Unable to load tickets.");
  state.tickets = await response.json();
  renderTickets();
  if (!state.tickets.length) {
    header.textContent = "No tickets yet";
    messageList.innerHTML =
      '<p class="p-5 text-sm text-slate-500">Create a ticket to start chatting.</p>';
  }
}
ticketList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-id]");
  if (item) selectTicket(Number(item.dataset.id));
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !state.ticket) return;
  input.disabled = true;
  const response = await fetch(
    `/account/api/tickets/${state.ticket.id}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );
  input.disabled = false;
  if (!response.ok) return;
  input.value = "";
  const message = await response.json();
  if (!messageList.querySelector(`[data-message-id="${message.id}"]`))
    appendMessages([message]);
  messageList.scrollTop = messageList.scrollHeight;
});
messageList.addEventListener("scroll", () => {
  if (messageList.scrollTop === 0) loadMessages(true);
});
window.addEventListener("ticket-chat-message", (event) => {
  if (state.ticket?.id !== Number(event.detail.ticketId)) return;
  if (
    !messageList.querySelector(`[data-message-id="${event.detail.message.id}"]`)
  )
    appendMessages([event.detail.message]);
  messageList.scrollTop = messageList.scrollHeight;
});
window.addEventListener("ticket-socket-open", subscribe);
$("new-ticket-btn").addEventListener("click", () => {
  $("ticket-modal").classList.remove("hidden");
  $("ticket-modal").classList.add("flex");
});
$("close-ticket-modal").addEventListener("click", () => {
  $("ticket-modal").classList.add("hidden");
  $("ticket-modal").classList.remove("flex");
});
$("ticket-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = $("ticket-error");
  const response = await fetch("/account/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: $("ticket-title").value,
      type: $("ticket-type").value,
      text: $("ticket-message").value,
    }),
  });
  if (!response.ok) {
    error.textContent =
      (await response.json()).error || "Unable to create ticket.";
    return;
  }
  const created = await response.json();
  state.tickets.unshift(created.ticket);
  renderTickets();
  await selectTicket(created.ticket.id);
  event.target.reset();
  $("ticket-modal").classList.add("hidden");
  $("ticket-modal").classList.remove("flex");
});
loadTickets().catch((error) => {
  ticketList.innerHTML = `<p class="p-5 text-sm text-red-600">${escapeHtml(error.message)}</p>`;
});
