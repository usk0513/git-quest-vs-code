/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#ffffff',
        'vscode-sidebar': '#f3f3f3',
        'vscode-border': '#e5e5e5',
        'vscode-text': '#000000',
        'vscode-text-secondary': '#616161',
        'vscode-text-muted': '#8c8c8c',
        'vscode-accent': '#005fb8',
        'vscode-accent-hover': '#004c99',
        'vscode-button': '#0078d4',
        'vscode-button-hover': '#006cbe',
        'vscode-hover': '#e8e8e8',
        'vscode-active': '#e0e0e0',
        'vscode-input-border': '#cecece',
        'vscode-input-focus': '#005fb8',
        'vscode-git-added': '#587c0c',
        'vscode-git-modified': '#895503',
        'vscode-git-deleted': '#ad0707',
        'vscode-git-staged-bg': '#e8f5e9',
        'vscode-success': '#16825d',
        'vscode-warning': '#bf8803',
        'vscode-error': '#e51400',
        'vscode-info': '#0078d4',
        'vscode-hint-bg': '#fff9e6',
      },
      boxShadow: {
        'vscode': '0 2px 8px rgba(0, 0, 0, 0.16)',
      }
    },
  },
  plugins: [],
}
