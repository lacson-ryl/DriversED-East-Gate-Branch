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
      '<p class="p-4 text-sm text-slate-500">No tickets yet.</p>';
    return;
  }

  const rows = state.tickets
    .map((ticket) => `<tr data-id="${ticket.id}" tabindex="0" role="button" class="ticket-row cursor-pointer border-b hover:bg-sky-50 focus:bg-sky-50 focus:outline-none ${state.ticket?.id === ticket.id ? "bg-sky-50" : ""}">
          <td class="px-3 py-3 font-semibold">${escapeHtml(ticket.title)}</td>
          <td class="px-3 py-3"><span class="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold uppercase text-sky-800">${escapeHtml(ticket.type)}</span></td>
          <td class="px-3 py-3 text-sm text-slate-600">${escapeHtml(ticket.creatorName || "—")}</td>
          <td class="px-3 py-3 text-sm text-slate-600">${escapeHtml(ticket.answeredByName || "Unanswered")}</td>
          <td class="px-3 py-3 text-right text-xs text-slate-500">${formatDate(ticket.createdAt)}</td>
        </tr>`)
    .join("");

  ticketList.innerHTML = `<div class="overflow-x-auto"><table class="w-full min-w-[620px] table-fixed text-left text-sm">
      <thead class="border-b bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th class="w-2/5 px-3 py-3">Title</th>
          <th class="w-1/6 px-3 py-3">Type</th>
          <th class="w-1/6 px-3 py-3">Created by</th>
          <th class="w-1/6 px-3 py-3">Answered by</th>
          <th class="w-1/6 px-3 py-3 text-right">Created</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>`;
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
  return `<div data-message-id="${message.id}" class="border-b p-3 ${staffMessage ? "bg-red-50" : "even:bg-slate-50"}">
    <div class="flex items-start justify-between gap-3">
      <div class="w-full"><div class="text-xs font-semibold text-slate-600">${escapeHtml(message.senderName || message.senderRole)}</div>
      <div class="mt-1 inline-block max-w-[85%] rounded-lg px-3 py-2 text-left text-sm ${staffMessage ? "border border-amber-400 bg-red-600 text-white" : "bg-slate-100"}">${escapeHtml(message.text)}</div>
      <div class="mt-1 text-xs text-slate-400">${formatDate(message.createdAt)}</div></div>
    </div></div>`;
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
  header.textContent = `${state.ticket.title} (${state.ticket.type})`;
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
    throw new Error(error.error || `Unable to load tickets (${response.status}).`);
  }
  state.tickets = await response.json();
  renderTickets();
  if (!state.tickets.length) {
    header.textContent = "No tickets yet";
    messageList.innerHTML = '<p class="p-4 text-slate-500">Create or select a ticket to start chatting.</p>';
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
