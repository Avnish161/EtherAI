/**
 * Etharaai - Main App Router & Controller
 * Page switching, auth check, global layout
 */

class AppController {
  constructor() {
    this.currentPage = 'login';
  }
  
  init() {
    try {
      this.renderLayout();
      this.bindEvents();
      if (!localStorage.getItem('token')) {
        this.showPage('login');
      }
    } catch (e) {
      console.error('App init error:', e);
      document.body.innerHTML += '<div style="color:red;padding:20px">App init failed: ' + e.message + '</div>';
    }
  }
  
  renderLayout() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Sidebar (hidden pre-auth) -->
      <div id="sidebar" class="sidebar" style="display: none;">
        <div class="logo mb-xl">Etharaai</div>
        <nav>
          <ul class="nav-list">
            <li class="nav-item active" data-page="dashboard" onclick="window.App.showPage('dashboard')">
              <span class="nav-icon">📊</span>
              Dashboard
            </li>
            <li class="nav-item" data-page="projects" onclick="window.App.showPage('projects')">
              <span class="nav-icon">📁</span>
              Projects
            </li>
          </ul>
        </nav>
        <div class="mt-auto">
          <div class="user-menu" onclick="Auth.logout()">
            <div class="user-avatar" id="user-avatar"></div>
            <div>
              <div class="user-name" id="user-name"></div>
              <div class="user-role text-xs" id="user-role"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="app-container">
        <main id="page-content" class="main-content">
          <!-- Page content loads here -->
        </main>
      </div>
    `;
    

    if (window.currentUser) {
      document.getElementById('user-avatar').innerHTML = Utils.getAvatar(window.currentUser.name);
      document.getElementById('user-name').textContent = window.currentUser.name;
      document.getElementById('user-role').textContent = window.currentUser.role;
      document.getElementById('sidebar').style.display = 'block';
    }
  }
  
  bindEvents() {

    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-item')) {
        e.preventDefault();
        const page = e.target.closest('.nav-item').dataset.page;
        this.showPage(page);
      }
    });
    

    document.addEventListener('click', (e) => {
      if (e.target.closest('.user-menu')) {
        Auth.logout();
        this.showPage('login');
      }
    });
  }
  
  showPage(page) {
    const content = document.getElementById('page-content');
    const sidebar = document.getElementById('sidebar');
    

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) item.classList.add('active');
    });
    
    this.currentPage = page;
    
    switch (page) {
case 'login':
        sidebar.style.display = 'none';
        window.Auth.showLogin();
        break;
      case 'register':
        sidebar.style.display = 'none';
        window.Auth.showRegister();
        break;
        
      case 'dashboard':
        sidebar.style.display = 'block';
        this.showDashboard();
        break;
        
      case 'projects':
        sidebar.style.display = 'block';
        this.showProjects();
        break;
        
      default:
        content.innerHTML = '<div class="text-muted">Page not found</div>';
    }
  }
  
  showDashboard() {
    Dashboard.render();
  }
  
  showProjects() {
    Projects.render();
  }
}


window.App = new AppController();
window.App.init();
window.Auth.init();

