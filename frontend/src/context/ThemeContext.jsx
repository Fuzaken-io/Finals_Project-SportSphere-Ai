// import { useLocalStorage } from '../hooks/useLocalStorage'; // Removed
import { useState, createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        try {
            const item = window.localStorage.getItem('sportsphere-theme');
            return item ? JSON.parse(item) : 'dark';
        } catch (error) {
            return 'dark';
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('sportsphere-theme', JSON.stringify(theme));
        } catch (e) {
            console.error("Failed to save theme", e);
        }
    }, [theme]);

    useEffect(() => {
        // Apply theme class to document
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
