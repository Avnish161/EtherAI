// Debug script - add to index.html temporarily
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  console.log('App:', typeof App);
  console.log('Auth:', typeof Auth);
  console.log('Utils:', typeof Utils);
});

