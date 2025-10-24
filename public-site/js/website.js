const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.remove("h-30", "bg-opacity-50");
    navbar.classList.add("h-20");
  } else {
    navbar.classList.remove("h-20");
    navbar.classList.add("h-30");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

async function fetchJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Fetch failed " + url);
  return r.json();
}

function makeServiceCard(s) {
  const card = document.createElement("article");
  card.className = "bg-white rounded-lg shadow p-4 min-w-[260px] flex-shrink-0";
  card.innerHTML = `
        <h4 class="font-semibold text-lg mb-2">${escapeHtml(s.title)}</h4>
        <p class="text-sm text-slate-600 mb-3">${escapeHtml(
          s.description || ""
        )}</p>
        <div class="mt-auto text-emerald-600 font-semibold">${
          s.price ? "₱" + Number(s.price).toFixed(2) : ""
        }</div>
      `;
  return card;
}

function makeInstructorCard(i) {
  const card = document.createElement("article");
  card.className = "bg-white rounded-lg shadow p-4 min-w-[240px] flex-shrink-0";
  const photo = i.photo || "/public/assets/instructor-placeholder.jpg";
  const services = (i.services || []).map((s) => escapeHtml(s)).join(", ");
  card.innerHTML = `
        <div class="h-36 w-full bg-slate-100 rounded overflow-hidden mb-3">
          <img src="${escapeAttr(photo)}" alt="${escapeAttr(
    i.name
  )}" class="w-full h-full object-cover"/>
        </div>
        <div class="font-semibold">${escapeHtml(i.name)}</div>
        <div class="text-sm text-slate-600">${services}</div>
      `;
  return card;
}

function makeLocationCard(l) {
  const card = document.createElement("article");
  card.className = "bg-white rounded-lg shadow p-4";
  card.innerHTML = `
        <div class="font-semibold">${escapeHtml(l.name)}</div>
        <div class="text-sm text-slate-600 mt-1">${escapeHtml(
          l.address || ""
        )}</div>
        <div class="text-sm text-slate-600 mt-1">${escapeHtml(
          l.phone || ""
        )}</div>
      `;
  return card;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/\n/g, "");
}

function wireSimpleCarousel(container, items, prevBtn, nextBtn) {
  const wrap = container;
  wrap.innerHTML = "";
  items.forEach((it) => wrap.appendChild(it));
  let pos = 0;
  const visible = Math.max(1, Math.floor(wrap.clientWidth / 260));
  function update() {
    const cardW = items[0]
      ? items[0].getBoundingClientRect().width +
        parseFloat(getComputedStyle(items[0]).marginRight || 16)
      : 260;
    wrap.style.transform = `translateX(${-pos * cardW}px)`;
  }
  prevBtn.addEventListener("click", () => {
    pos = Math.max(0, pos - 1);
    update();
  });
  nextBtn.addEventListener("click", () => {
    pos = Math.min(items.length - visible, pos + 1);
    update();
  });
  window.addEventListener("resize", update);
  update();
}

async function init() {
  try {
    // Expect JSON arrays at these endpoints: /api/services, /api/instructors, /api/locations
    const services = await fetchJSON("/api/services");
    const serviceCards = services.map(makeServiceCard);
    wireSimpleCarousel(
      document.getElementById("services-carousel"),
      serviceCards,
      document.getElementById("prev-services"),
      document.getElementById("next-services")
    );

    const instructors = await fetchJSON("/api/instructors");
    const instructorCards = instructors.map(makeInstructorCard);
    wireSimpleCarousel(
      document.getElementById("instructors-carousel"),
      instructorCards,
      document.getElementById("prev-instructors"),
      document.getElementById("next-instructors")
    );

    const locations = await fetchJSON("/api/locations");
    const grid = document.getElementById("locations-grid");
    locations.forEach((l) => grid.appendChild(makeLocationCard(l)));
  } catch (err) {
    console.error(err);
    // graceful fallback content
    document.getElementById("services-carousel").innerHTML =
      '<div class="text-slate-500 p-4">Services are unavailable right now.</div>';
    document.getElementById("instructors-carousel").innerHTML =
      '<div class="text-slate-500 p-4">Instructors are unavailable right now.</div>';
  }
}

document.addEventListener("DOMContentLoaded", init);

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loadCarouselSection();
      obs.unobserve(entry.target); // only trigger once
    }
  });
});

observer.observe(document.getElementById("instructor-carousel"));

function loadCarouselSection() {
  document.getElementById("carousel-loading").style.display = "block";

  fetch("/public/api/instructors-list")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("carousel-loading").style.display = "none";
      renderCarousel(data);
    })
    .catch((err) => {
      document.getElementById("carousel-loading").textContent =
        "Failed to load instructors.";
      console.error("Error loading carousel:", err);
    });
}

function renderCarousel(instructors) {
  const container = document.getElementById("carousel-container");

  instructors.forEach((instructor) => {
    const card = document.createElement("div");

    const img = document.createElement("img");
    img.src = instructor.imageUrl;
    img.alt = instructor.name;

    const name = document.createElement("p");
    name.textContent = instructor.name;

    card.appendChild(img);
    card.appendChild(name);
    container.appendChild(card);
  });
}
