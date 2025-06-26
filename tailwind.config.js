module.exports = {
  content: [
    './src/**/*.js', // Scans all JS files to find classes in use
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Critical! Adds a high-priority selector to all utility classes
  // This ensures our styles only take effect inside #smartfine-chat-container
  important: '#smartfine-chat-container',
}
