const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
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
    .then(res => res.json())
    .then(data => {
      document.getElementById("carousel-loading").style.display = "none";
      renderCarousel(data);
    })
    .catch(err => {
      document.getElementById("carousel-loading").textContent = "Failed to load instructors.";
      console.error("Error loading carousel:", err);
    });
}

function renderCarousel(instructors) {
  const container = document.getElementById("carousel-container");

  instructors.forEach(instructor => {
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
