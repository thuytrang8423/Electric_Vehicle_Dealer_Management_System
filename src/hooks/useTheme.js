import { useEffect, useState } from "react";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  
  useEffect(() => {
    const appElement = document.querySelector(".app");
    if (appElement) {
      appElement.className = `app ${isDarkMode ? 'dark-mode' : 'light-mode'}`;
    }
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return { isDarkMode, toggleDarkMode };
}
