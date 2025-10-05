// Main application entry point
import { CommentApp } from './app.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CommentApp();
    app.init();
});
