const navToggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");
let isMenuOpen = false;

// Initial state
if (window.innerWidth < 768) {
  navMenu.style.display = "none";
}

navToggle.addEventListener("click", (e) => {
  console.log("click");
  e.stopPropagation(); // ✅ Prevent bubbling to window
  isMenuOpen = !isMenuOpen;
  navMenu.style.display = isMenuOpen ? "flex" : "none";
});

// ✅ Persistent outside click listener
window.addEventListener("click", (event) => {
  if (
    isMenuOpen &&
    navMenu &&
    !navMenu.contains(event.target) &&
    !navToggle.contains(event.target)
  ) {
    navMenu.style.display = "none";
    isMenuOpen = false;
  }
});

// ✅ Smooth scroll for nav links
document.querySelectorAll("#nav-menu .nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    // ✅ Close mobile menu after clicking
    if (window.innerWidth < 768) {
      navMenu.style.display = "none";
      isMenuOpen = false;
    }
  });
});

const recaptchaContainer = document.getElementById("recaptcha-container");
const captchaSiteKey = document.getElementById("captchaSiteKey").value;
const submitBtn = document.getElementById("contact-form-button");

// Disable button initially
submitBtn.disabled = true;

// Render reCAPTCHA and hook into callback
grecaptcha.ready(() => {
  grecaptcha.render(recaptchaContainer, {
    sitekey: captchaSiteKey,
    callback: () => {
      // ✅ Captcha solved → enable button
      submitBtn.disabled = false;
    },
    "expired-callback": () => {
      // ❌ Captcha expired → disable button again
      submitBtn.disabled = true;
    },
  });
});

// Contact form handler
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const formMessage = document.getElementById("form-message");

  contactForm.addEventListener("submit", async (e) => {
    console.log("click");
    e.preventDefault();

    // ✅ Capture reCAPTCHA token
    const token = grecaptcha.getResponse();
    if (!token) {
      formMessage.classList.remove("hidden");
      formMessage.classList.add("bg-red-50", "text-red-800");
      formMessage.textContent = "✗ Please complete the captcha.";
      return;
    }

    // Collect form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    try {
      formMessage.classList.remove(
        "hidden",
        "bg-red-50",
        "text-red-800",
        "bg-green-50",
        "text-green-800",
      );
      formMessage.textContent = "Sending...";
      formMessage.classList.add("bg-blue-50", "text-blue-800", "flex");

      // ✅ Send form data + token to backend
      const response = await fetch("/public/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      if (response.ok) {
        formMessage.classList.remove("bg-blue-50", "text-blue-800");
        formMessage.classList.add("bg-green-50", "text-green-800");
        formMessage.textContent =
          "✓ Message sent successfully! We'll get back to you soon.";
        contactForm.reset();
        grecaptcha.reset(); // reset captcha for next submission
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      formMessage.classList.remove("bg-blue-50", "text-blue-800");
      formMessage.classList.add("bg-red-50", "text-red-800");
      formMessage.textContent =
        "✗ Error sending message. Please try again or contact us directly.";
    }
  });
}
