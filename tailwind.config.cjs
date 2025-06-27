module.exports = {
  content: ["./src/**/*.{js,html}", "./public/index.html"],
  theme: {
    extend: {
      height: {
        'chat-view': '80vh',
      },
      width: {
        'chat-view': '60vw',
      },
      maxWidth: {
        'chat-view': '900px',
      },
      minWidth: {
        'chat-view': '600px',
      }
    },
  },
  plugins: [],
}
