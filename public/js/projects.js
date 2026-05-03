/**
 * Etharaai - Projects Module
 * List projects, create project, project detail
 */

const Projects = {
  projects: [],
  selectedMember: null,
  
  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="loading"></div>';
    
    try {
      const data = await API.getProjects();
      this.projects = data.projects;
      content.innerHTML = this.renderProjects();
    } catch (error) {
      content.innerHTML = '<div class="text-muted">Failed to load projects</div>';
    }
  },
  
  renderProjects() {
    const createBtn = window.currentUser ? `
      <button class="btn btn-primary mb-xl" onclick="Projects.showCreateModal()">
        <span>➕</span> New Project
      </button>
    ` : '';
    
    const projectsHtml = this.projects.map(project => {
      const progress = Math.round((project.completed_count / Math.max(project.task_count, 1)) * 100);
      
      return `
        <div class="project-card card grid gap-md p-xl cursor-pointer" onclick="Projects.showDetail(${project.id})">
          <div class="flex justify-between">
            <h3>${project.name}</h3>
            <div class="text-sm text-muted">${project.member_count} members</div>
          </div>
          ${project.description ? `<p class="text-muted">${project.description}</p>` : ''}
          <div class="flex gap-md">
            <div class="flex-1">
              <div class="text-xs text-muted">Progress</div>
              <div class="progress-bar mt-xs">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="text-xs">${progress}%</div>
            </div>
            <div class="text-right">
              <div class="text-sm">Owner: ${project.owner_name}</div>
              <div class="text-xs text-muted">${Utils.formatDate(project.created_at)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div>
        <div class="header">
          <h1>Projects</h1>
          ${createBtn}
        </div>
        <div class="grid gap-lg" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));">
          ${projectsHtml || '<div class="text-muted col-span-full text-center py-xl">No projects yet. Create one to get started!</div>'}
        </div>
      </div>
    `;
  },
  
  showCreateModal() {
    const content = `
      <div class="card p-xl">
        <h3>Create New Project</h3>
        <form id="create-project-form">
          <div class="form-group">
            <label class="label">Project Name</label>
            <input type="text" id="project-name" class="input" placeholder="My Awesome Project" required>
          </div>
          <div class="form-group">
            <label class="label">Description</label>
            <textarea id="project-desc" class="input textarea" rows="4" placeholder="Brief description..."></textarea>
          </div>
          <div class="flex gap-md">
            <button type="submit" class="btn btn-primary flex-1">Create Project</button>
            <button type="button" class="btn btn-secondary" onclick="Utils.Modal.close()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    Utils.Modal.open(content);
    document.getElementById('create-project-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreate();
    });
  },
  
  async handleCreate() {
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-desc').value;
    
    try {
      await API.createProject({ name, description });
      Utils.Modal.close();
      Utils.Toast.success('Project created!');
      this.render(); // Refresh list
    } catch (error) {
      console.error('Create project failed:', error);
    }
  },
  
  async showDetail(id) {
    try {
      const [data, taskData] = await Promise.all([
        API.getProject(id),
        API.getProjectTasks(id)
      ]);
      const content = document.getElementById('page-content');
      Tasks.currentProjectId = id;
      
      content.innerHTML = `
        <div>
          <div class="header mb-xl">
            <h1>${data.project.name}</h1>
            <div class="flex gap-lg">
              <button class="btn btn-secondary" onclick="App.showPage('projects')">← Back</button>
              <button class="btn btn-primary" onclick="Projects.showEditModal(${id})">Edit</button>
              ${Auth.isAdmin() ? `<button class="btn btn-danger" onclick="Projects.deleteProject(${id})">Delete</button>` : ''}
            </div>
          </div>
          
          <div class="grid gap-xl lg:grid-cols-3">
            <!-- Project Info -->
            <div class="lg:col-span-1">
              <div class="card p-lg">
                <h4>Project Info</h4>
                ${data.project.description ? `<p>${data.project.description}</p>` : '<p class="text-muted">No description</p>'}
                <div class="mt-lg">
                  <div class="text-sm text-muted mb-sm">Owner</div>
                  <div class="flex items-center gap-sm">
                    ${Utils.getAvatar(data.project.owner_name)}
                    <span>${data.project.owner_name}</span>
                  </div>
                </div>
                <div class="mt-lg">
                  <div class="text-sm">${data.taskStats.total} Tasks</div>
                  <div class="progress-bar mt-xs">
                    <div class="progress-fill" style="width: ${Math.round((data.taskStats.done / Math.max(data.taskStats.total, 1)) * 100)}%"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Tasks -->
            <div class="lg:col-span-2">
              <div class="card p-lg">
                <h4>Tasks</h4>
                <button class="btn btn-primary mb-lg" onclick="Tasks.showCreateModal(${data.project.id})">
                  ➕ New Task
                </button>
                <div id="project-tasks-kanban">
                  ${Tasks.renderKanban(data.project.id, taskData.tasks)}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Members -->
          <div class="card mt-xl p-lg">
            <h4>Members (${data.members.length})</h4>
            ${Auth.isAdmin() ? `<button class="btn btn-sm btn-secondary mb-lg" onclick="Projects.showAddMemberModal(${data.project.id})">Add Member</button>` : ''}
            <div class="grid gap-sm">
              ${data.members.map(member => `
                <div class="flex items-center gap-md p-sm bg-bg-secondary rounded-md">
                  ${Utils.getAvatar(member.name)}
                  <div class="flex-1">
                    <div>${member.name}</div>
                    <div class="text-muted text-sm">${member.email}</div>
                  </div>
                  <span class="badge">${member.role}</span>
                  ${Auth.isAdmin() ? `<button class="btn btn-sm btn-danger ml-auto" onclick="Projects.removeMember(${data.project.id}, ${member.user_id})">Remove</button>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Load project failed:', error);
    }
  },
  
  renderKanban(projectId, stats) {
    // Simplified list view for now (full kanban in Tasks module)
    return `
      <div class="grid gap-md">
        <div class="flex gap-sm text-sm">
          <span>Todo: ${stats.todo || 0}</span>
          <span>In Progress: ${stats.in_progress || 0}</span>
          <span>Review: ${stats.review || 0}</span>
          <span>Done: ${stats.done || 0}</span>
        </div>
        <p class="text-muted">Full kanban view available in Tasks module</p>
      </div>
    `;
  },
  
  showEditModal(id) {
    // Fetch current project data and show edit form
    API.getProject(id).then(data => {
      const content = `
        <div class="card p-xl">
          <h3>Edit Project</h3>
          <form id="edit-project-form">
            <input type="hidden" id="edit-project-id" value="${id}">
            <div class="form-group">
              <label class="label">Name</label>
              <input type="text" id="edit-name" class="input" value="${data.project.name}">
            </div>
            <div class="form-group">
              <label class="label">Description</label>
              <textarea id="edit-desc" class="input textarea" rows="4">${data.project.description || ''}</textarea>
            </div>
            <div class="flex gap-md">
              <button type="submit" class="btn btn-primary flex-1">Update</button>
              <button type="button" class="btn btn-secondary" onclick="Utils.Modal.close()">Cancel</button>
            </div>
          </form>
        </div>
      `;
      Utils.Modal.open(content);
      document.getElementById('edit-project-form').addEventListener('submit', (e) => {
        e.preventDefault();
        Projects.handleEdit(id);
      });
    });
  },
  
  async handleEdit(id) {
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-desc').value;
    
    try {
      await API.updateProject(id, { name, description });
      Utils.Modal.close();
      Utils.Toast.success('Project updated');
      Projects.showDetail(id);
    } catch (error) {
      console.error('Update failed:', error);
    }
  },
  
  async deleteProject(id) {
    if (!confirm('Delete this project? All tasks will be deleted.')) return;
    
    try {
      await API.deleteProject(id);
      Utils.Toast.success('Project deleted');
      App.showPage('projects');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  },
  
  showAddMemberModal(projectId) {
    this.selectedMember = null;
    const content = `
      <div class="card p-xl">
        <h3>Add Member</h3>
        <div class="form-group">
          <label class="label">Search User</label>
          <input type="text" id="member-search" class="input" placeholder="Type name or email...">
        </div>
        <div class="form-group">
          <label class="label">Project Role</label>
          <select id="member-role" class="input select">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div id="member-results" class="mt-md"></div>
        <div class="flex gap-md mt-xl">
          <button type="button" class="btn btn-primary" onclick="Projects.addSelectedMember(${projectId})" id="add-member-btn" disabled>Add Member</button>
          <button type="button" class="btn btn-secondary" onclick="Utils.Modal.close()">Cancel</button>
        </div>
      </div>
    `;
    
    Utils.Modal.open(content);
    const input = document.getElementById('member-search');
    input.addEventListener('input', Utils.debounce(() => {
      Projects.searchMembers(projectId, input.value);
    }, 250));
  },

  async searchMembers(projectId, query) {
    const results = document.getElementById('member-results');
    const addButton = document.getElementById('add-member-btn');
    this.selectedMember = null;
    addButton.disabled = true;

    if (!query || query.trim().length < 2) {
      results.innerHTML = '<div class="text-muted text-sm">Type at least 2 characters.</div>';
      return;
    }

    try {
      const data = await API.searchUsers(query.trim());
      if (!data.users.length) {
        results.innerHTML = '<div class="text-muted text-sm">No users found.</div>';
        return;
      }

      results.innerHTML = data.users.map(user => {
        const safeName = user.name.replace(/'/g, "\\'");
        const safeEmail = user.email.replace(/'/g, "\\'");
        return `
          <button type="button" class="btn btn-secondary w-100 mb-sm justify-start" onclick="Projects.selectMember(${user.id}, '${safeName}', '${safeEmail}')">
            ${Utils.getAvatar(user.name)}
            <span>${user.name} (${user.email})</span>
          </button>
        `;
      }).join('');
    } catch (error) {
      results.innerHTML = '<div class="text-muted text-sm">User search failed.</div>';
    }
  },

  selectMember(id, name, email) {
    this.selectedMember = { id, name, email };
    document.getElementById('member-search').value = `${name} (${email})`;
    document.getElementById('member-results').innerHTML = `<div class="text-sm">Selected: ${name}</div>`;
    document.getElementById('add-member-btn').disabled = false;
  },

  async addSelectedMember(projectId) {
    if (!this.selectedMember) return;

    try {
      await API.addProjectMember(projectId, {
        userId: this.selectedMember.id,
        role: document.getElementById('member-role').value
      });
      Utils.Modal.close();
      Utils.Toast.success('Member added');
      Projects.showDetail(projectId);
    } catch (error) {
      console.error('Add member failed:', error);
    }
  },
  
  async removeMember(projectId, userId) {
    if (!confirm('Remove this member?')) return;
    
    try {
      await API.removeProjectMember(projectId, userId);
      Utils.Toast.success('Member removed');
      App.showPage('projects'); // Refresh
    } catch (error) {
      console.error('Remove failed:', error);
    }
  }
};

