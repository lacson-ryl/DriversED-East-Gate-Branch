/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../accounts-site/f-jsfiles/**/*.js",
    "../accounts-site/views/**/*.ejs",
    "../public-site/f-jsfiles/**/*.js",
    "../public-site/views/**/*.ejs",
  ],
  theme: {
    extend: {
      fontFamily: {
        PlayfairDisplaySC: ["Playfair Display SC", "serif"],
        RobotoSerif: ["Roboto Serif", "serif"],
        Montserrat: ["Montserrat", "serif"],
      },
      overflow: {
        "hidden-scrollbar": "hidden",
      },
      margin: {
        "ml-250": "220px",
        "ml-64": "64px", // For phone main content width considering sidebar
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out forwards",
        fadeOut: "fadeOut 0.5s ease-in-out forwards",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        spin: {
          to: {
            transform: "rotate(360deg)",
          },
        },
        zIndex: {
          50: "50",
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities(
        {
          ".w-calc": {
            width: "calc(100% - 220px)", // Example for main content width considering sidebar
          },
          ".h-calc": {
            heigth: "calc(100% - 56px)",
          },
          ".desktop-w-calc": {
            width: "calc(100% - 160px)",
          },
          ".phone-w-calc": {
            width: "calc(100% - 64px)",
          },
          ".max-h-data-table": {
            maxHeight: "30rem",
          },
          ".no-scrollbar::-webkit-scrollbar": {
            display: "none",
          },
          ".no-scrollbar": {
            "-ms-overflow-style": "none" /* IE and Edge */,
            "scrollbar-width": "none" /* Firefox */,
          },
          ".custom-scrollbar": {
            "scrollbar-width": "thin" /* For Firefox */,
            "scrollbar-color":
              "rgba(255, 255, 255, 0.5) transparent" /* Thumb and track colors */,
          },
          ".custom-scrollbar::-webkit-scrollbar": {
            width: "8px" /* Width of the scrollbar */,
          },
          ".custom-scrollbar::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255, 255, 255, 0.5)" /* Thumb color */,
            borderRadius: "4px" /* Rounded corners */,
          },
          ".custom-scrollbar::-webkit-scrollbar-track": {
            backgroundColor: "transparent" /* Transparent track */,
          },
          ".sidebar-width": {
            width: "220px",
          },
          ".side-icons": {
            width: "30px",
            height: "30px",
          },
          ".dashboard-placards": {
            width: "360px",
            height: "140px",
          },
          ".active-nav": {
            "@apply bg-white text-sky-950 font-bold": {},
          },
          ".hover-bg-custom": {
            "@apply bg-slate-100 bg-opacity-10": {},
          },
          ".reverse-color": {
            filter: "invert(100%)",
          },
          ".reverse-color:hover": {
            filter: "invert(0%)",
          },
          ".reverse-colorII": {
            filter: "invert(100%)",
          },
          ".reverse-colorII:hover": {
            filter: "invert(0%)",
          },
          ".input-container": {
            position: "relative",
          },
          ".info-message": {
            display: "none",
            position: "absolute",
            top: "100%",
            left: "0",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ccc",
            padding: "5px",
            borderRadius: "3px",
            fontSize: "12px",
            zIndex: "10",
          },
          ".input-container input:hover + .info-message, .input-container input:focus + .info-message":
            {
              display: "block",
            },
          ".notification": {
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: "1000",
          },
          ".notification-success": {
            backgroundColor: "green",
            color: "gold",
          },
          ".notification-error": {
            backgroundColor: "red",
            color: "gold",
          },
          // Collapsible header
          ".collapsible-header": {
            cursor: "pointer",
            transition: "background-color 0.4s ease",
          },
          ".collapsible-header:hover": {
            backgroundColor: "#2563eb",
          },
          // Collapsible content
          ".collapsible-content": {
            maxHeight: "0",
            overflow: "hidden",
            transition: "max-height 0.6s ease-in-out, opacity 0.3s ease-in-out",
            opacity: "0",
          },
          ".collapsible-content.expanded": {
            maxHeight: "500px",
            opacity: "1",
          },
          // Rotations
          ".rotate-180": {
            transform: "rotate(180deg)",
            transition: "transform 0.6s ease",
          },
          ".rotate-0": {
            transform: "rotate(0deg)",
            transition: "transform 0.6s ease",
          },
          ".card-inner.rotated": {
            transform: "rotateY(180deg)",
          },
        },
        ["responsive", "hover", "focus"]
      );
    },
  ],
};
