/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./f-jsfiles/**/*.js", "./views/**/*.ejs"],
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
        "ml-250": "220px", // Custom margin-left of 250px
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out forwards",
        fadeOut: "fadeOut 0.5s ease-in-out forwards",
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
            "scrollbar-width": "thin", /* For Firefox */
            "scrollbar-color": "rgba(255, 255, 255, 0.5) transparent", /* Thumb and track colors */
          },
          ".custom-scrollbar::-webkit-scrollbar": {
            width: "8px", /* Width of the scrollbar */
          },
          ".custom-scrollbar::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255, 255, 255, 0.5)", /* Thumb color */
            borderRadius: "4px", /* Rounded corners */
          },
          ".custom-scrollbar::-webkit-scrollbar-track": {
            backgroundColor: "transparent", /* Transparent track */
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
        },
        ["responsive", "hover", "focus"]
      );
    },
  ],
};