/**
 * Etharaai - Authentication Module
 * Login, Register, User state management
 */

class AuthController {
  constructor() {}
  
  init() {
    const token = localStorage.getItem('token');
    if (token) {
      API.getMe().then(user => {
        if (user) {
          this.setUser(user.user);
          Utils.Modal.close();
          App.showPage('dashboard');
        } else {
          this.logout();
        }
      }).catch(() => {
        this.logout();
      });
    }
  }
  
  setUser(user) {
    window.currentUser = user;
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) userRoleEl.textContent = user.role;
  }
  
  logout() {
    localStorage.removeItem('token');
    window.currentUser = null;
    App.showPage('login');
    Utils.Toast.success('Logged out');
  }
  
  showLogin() {
    const content = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Welcome Back</h2>
          <p class="text-muted">Sign in to your account</p>
          <form id="loginForm">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="loginEmail" class="input" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="loginPassword" class="input" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Sign In</button>
          </form>
          <p class="text-center mt-2">
            No account? <a href="#" onclick="Auth.showRegister(); return false;">Sign up</a>
          </p>
        </div>
      </div>
    `;
    Utils.Modal.open(content);
    document.getElementById('loginForm').onsubmit = (e) => {
      e.preventDefault();
      this.handleLogin();
    };
  }
  
  showRegister() {
    Utils.Modal.close();
    const content = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Create Account</h2>
          <p class="text-muted">Join Etharaai</p>
          <form id="registerForm">
            <div class="form-group">
              <label>Name</label>
              <input type="text" id="regName" class="input" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="regEmail" class="input" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="regPassword" class="input" minlength="6" required>
            </div>
            <div class="form-group">
              <label>Role</label>
              <select id="regRole" class="input">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary w-100">Create Account</button>
          </form>
          <p class="text-center mt-2">
            Have account? <a href="#" onclick="Auth.showLogin(); return false;">Sign in</a>
          </p>
        </div>
      </div>
    `;
    Utils.Modal.open(content);
    document.getElementById('registerForm').onsubmit = (e) => {
      e.preventDefault();
      this.handleRegister();
    };
  }
  
  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      Utils.showLoading(document.querySelector('#loginForm button'));
      const result = await API.login({ email, password });
      API.setToken(result.token);
      this.setUser(result.user);
      Utils.Modal.close();
      Utils.Toast.success('Welcome back!');
      App.showPage('dashboard');
    } catch (error) {
      Utils.Toast.error(error.message || 'Login failed');
    } finally {
      Utils.showLoading(null);
    }
  }
  
  async handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    try {
      Utils.showLoading(document.querySelector('#registerForm button'));
      const result = await API.register({ name, email, password, role });
      API.setToken(result.token);
      this.setUser(result.user);
      Utils.Modal.close();
      Utils.Toast.success('Account created!');
      App.showPage('dashboard');
    } catch (error) {
      Utils.Toast.error(error.message || 'Registration failed');
    } finally {
      Utils.showLoading(null);
    }
  }
  
  isAdmin() {
    return window.currentUser?.role === 'admin';
  }
}

window.Auth = new AuthController();

