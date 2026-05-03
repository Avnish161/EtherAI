/**
 * Etharaai - Shared Utilities
 * Toasts, Modals, Date formatting, etc.
 */

// Base API URL
const API_BASE = '/api';

// Toast notifications
class Toast {
  static show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  static success(message) { this.show(message, 'success'); }
  static error(message) { this.show(message, 'error'); }
  static info(message) { this.show(message, 'info'); }
}

// Modal handler
class Modal {
  static open(contentHtml) {
    const container = document.getElementById('modal-container');
    const modal = document.querySelector('.modal') || this.createModal();
    modal.innerHTML = contentHtml;
    container.appendChild(modal);
    container.classList.add('active');
    
    // Close on outside click
    container.addEventListener('click', this.closeOnBackdrop);
    
    // Close on ESC
    document.addEventListener('keydown', this.closeOnEsc);
    
  }
  
  static createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    return modal;
  }
  
  static closeOnBackdrop(e) {
    if (e.target.id === 'modal-container') {
      Modal.close();
    }
  }
  
  static closeOnEsc(e) {
    if (e.key === 'Escape') {
      Modal.close();
    }
  }
  
  static close() {
    const container = document.getElementById('modal-container');
    container.classList.remove('active');
    setTimeout(() => {
      const modal = container.querySelector('.modal');
      if (modal) container.removeChild(modal);
    }, 300);
  }
}

// Date utilities
const formatDate = (dateStr, format = 'short') => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (format === 'short') {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  }
  
  if (format === 'full') {
    return date.toLocaleString();
  }
  
  return date.toLocaleDateString();
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Loading spinner
const showLoading = (el) => {
  if (!el) return;
  el.innerHTML = '<div class="loading"></div>';
};

// Avatar generator
const getAvatar = (name) => {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return `<div class="user-avatar">${initials}</div>`;
};

// Priority/Status badges
const renderBadge = (type, value) => {
  const classMap = {
    priority: {
      high: 'badge-priority-high',
      medium: 'badge-priority-medium',
      low: 'badge-priority-low'
    },
    status: {
      todo: 'badge-status-todo',
      'in_progress': 'badge-status-in_progress',
      review: 'badge-status-review',
      done: 'badge-status-done'
    }
  };
  
  return `<span class="badge ${classMap[type]?.[value] || ''}">${value.replace('_', ' ').toUpperCase()}</span>`;
};

// Export utils - always available
window.Utils = {
  Toast,
  Modal,
  formatDate,
  debounce,
  showLoading,
  getAvatar,
  renderBadge
};
console.log('Utils loaded to window');

