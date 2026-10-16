const state = {
  tickets: [],
  ticket: null,
  offset: 0,
  loading: false,
  hasMore: true,
  requestVersion: 0,
};
const pageSize = 20;
const ticketList = document.getElementById("ticket-list");
const messageList = document.getElementById("message-list");
const header = document.getElementById("thread-header");
const input = document.getElementById("message-input");
const form = document.getElementById("message-form");
const modal = document.getElementById("ticket-modal");
const subscribeToTicket = () => {
  if (state.ticket && window.notifSocket?.readyState === WebSocket.OPEN) {
    window.notifSocket.send(
      JSON.stringify({ type: "subscribe_chat", ticketId: state.ticket.id }),
    );
  }
};

const escapeHtml = (value) =>
  String(value).replace(
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

function renderTickets() {
  if (!state.tickets.length) {
    ticketList.innerHTML =
      '<p class="p-5 text-sm text-slate-500">No tickets yet.</p>';
    return;
  }

  const cards = state.tickets
    .map(
      (
        ticket,
      ) => `<button type="button" data-id="${ticket.id}" class="ticket-row w-full border-b border-slate-100 p-4 text-left transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${state.ticket?.id === ticket.id ? "bg-blue-50 ring-inset ring-2 ring-blue-100" : ""}">
          <div class="flex items-start justify-between gap-3"><strong class="truncate text-sm text-[#0B2D4A]">${escapeHtml(ticket.title)}</strong><span class="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">${escapeHtml(ticket.type)}</span></div>
          <p class="mt-2 text-xs text-slate-500">Created by ${escapeHtml(ticket.creatorName || "You")}</p>
          <p class="mt-1 text-xs text-slate-400">${escapeHtml(ticket.answeredByName || "Unanswered")} · ${formatDate(ticket.createdAt)}</p>
        </button>`,
    )
    .join("");

  ticketList.innerHTML = cards;
}

ticketList.addEventListener("click", (event) => {
  const row = event.target.closest(".ticket-row");
  if (row) selectTicket(Number(row.dataset.id));
});

ticketList.addEventListener("keydown", (event) => {
  const row = event.target.closest(".ticket-row");
  if (row && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    selectTicket(Number(row.dataset.id));
  }
});

function renderMessage(message) {
  const staffMessage = message.senderRole === "admin";
  return `<div data-message-id="${message.id}" class="flex w-full min-w-0 ${staffMessage ? "justify-start" : "justify-end"}"><div class="flex min-w-0 max-w-[76%] flex-col ${staffMessage ? "items-start" : "items-end"}"><p class="mb-1 max-w-full text-[10px] font-semibold text-slate-400">${escapeHtml(message.senderName || message.senderRole)}</p><div class="chat-new-message ${staffMessage ? "chat-new-message--staff" : "chat-new-message--user"}">${escapeHtml(message.text)}</div><p class="mt-1 max-w-full text-[10px] text-slate-400">${formatDate(message.createdAt)}</p></div></div>`;
}

function appendMessages(messages, prepend = false) {
  const html = messages.map(renderMessage).join("");
  if (prepend) {
    const oldHeight = messageList.scrollHeight;
    messageList.insertAdjacentHTML("afterbegin", html);
    messageList.scrollTop += messageList.scrollHeight - oldHeight;
  } else messageList.insertAdjacentHTML("beforeend", html);
}

async function loadMessages(loadOlder = false) {
  if (!state.ticket || state.loading || (!state.hasMore && loadOlder)) return;
  state.loading = true;
  const selectedTicketId = state.ticket.id;
  const requestVersion = ++state.requestVersion;
  const offset = loadOlder ? state.offset + pageSize : 0;
  const response = await fetch(
    `/account/api/tickets/${selectedTicketId}/messages?limit=${pageSize}&offset=${offset}`,
  );
  if (!response.ok) throw new Error("Unable to load messages.");
  const data = await response.json();
  if (
    requestVersion !== state.requestVersion ||
    !state.ticket ||
    state.ticket.id !== selectedTicketId
  ) {
    state.loading = false;
    return;
  }
  if (!loadOlder) messageList.innerHTML = "";
  appendMessages(data.messages, loadOlder);
  state.offset = offset;
  state.hasMore = data.messages.length === pageSize;
  state.loading = false;
  if (!loadOlder) messageList.scrollTop = messageList.scrollHeight;
  subscribeToTicket();
}

async function selectTicket(id) {
  const selectedTicket = state.tickets.find((ticket) => ticket.id === id);
  if (!selectedTicket) return;
  state.requestVersion += 1;
  state.ticket = selectedTicket;
  if (!state.ticket) return;
  state.offset = 0;
  state.hasMore = true;
  state.loading = false;
  header.innerHTML = `<div class="flex items-center justify-between gap-3"><div><h2 class="font-bold text-[#0B2D4A]">${escapeHtml(state.ticket.title)}</h2><p class="mt-1 text-xs text-slate-500">${escapeHtml(state.ticket.type)} · ${formatDate(state.ticket.createdAt)}</p></div><span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">${escapeHtml(state.ticket.answeredByName || "Open")}</span></div>`;
  input.disabled = false;
  form.querySelector("button").disabled = false;
  renderTickets();
  try {
    await loadMessages();
  } catch (error) {
    messageList.innerHTML = `<p class="p-4 text-red-600">${escapeHtml(error.message)}</p>`;
  }
}

async function loadTickets() {
  const response = await fetch("/account/api/tickets");
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `Unable to load tickets (${response.status}).`,
    );
  }
  state.tickets = await response.json();
  renderTickets();
  if (!state.tickets.length) {
    header.textContent = "No tickets yet";
    messageList.innerHTML =
      '<p class="p-4 text-slate-500">Create or select a ticket to start chatting.</p>';
  }
}

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
  if (message.senderRole === "admin") {
    state.ticket.answeredByName = message.senderName;
    renderTickets();
  }
  if (!messageList.querySelector(`[data-message-id="${message.id}"]`))
    appendMessages([message]);
  messageList.scrollTop = messageList.scrollHeight;
});

messageList.addEventListener("scroll", () => {
  if (messageList.scrollTop === 0) loadMessages(true).catch(console.error);
});
window.addEventListener("ticket-chat-message", (event) => {
  if (state.ticket?.id !== Number(event.detail.ticketId)) return;
  if (event.detail.message.senderRole === "admin") {
    state.ticket.answeredByName = event.detail.message.senderName;
    renderTickets();
  }
  if (
    !messageList.querySelector(`[data-message-id="${event.detail.message.id}"]`)
  )
    appendMessages([event.detail.message]);
  messageList.scrollTop = messageList.scrollHeight;
});
window.addEventListener("ticket-socket-open", subscribeToTicket);

if (modal) {
  document.getElementById("new-ticket-btn").addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });
  document
    .getElementById("close-ticket-modal")
    .addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    });
  document
    .getElementById("ticket-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = document.getElementById("ticket-error");
      const response = await fetch("/account/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: document.getElementById("ticket-title").value,
          type: document.getElementById("ticket-type").value,
          text: document.getElementById("ticket-message").value,
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
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    });
}

loadTickets().catch((error) => {
  ticketList.innerHTML = `<p class="p-4 text-red-600">${escapeHtml(error.message)}</p>`;
});
