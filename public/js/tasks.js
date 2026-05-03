/**
 * Etharaai - Tasks Module
 * Kanban board, task CRUD modals
 */

const Tasks = {
  currentProjectId: null,
  
  async showCreateModal(projectId) {
    Tasks.currentProjectId = projectId;
    const memberData = await API.getProjectMembers(projectId);
    const memberOptions = memberData.members.map(member => `
      <option value="${member.user_id}">${member.name} (${member.email})</option>
    `).join('');

    const content = `
      <div class="card p-xl">
        <h3>Create Task</h3>
        <form id="create-task-form">
          <input type="hidden" id="task-project-id" value="${projectId}">
          <div class="form-group">
            <label class="label">Title</label>
            <input type="text" id="task-title" class="input" placeholder="Task title" required>
          </div>
          <div class="form-group">
            <label class="label">Description</label>
            <textarea id="task-desc" class="input textarea" rows="3"></textarea>
          </div>
          <div class="grid gap-md grid-cols-2">
            <div class="form-group">
              <label class="label">Priority</label>
              <select id="task-priority" class="input select">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Due Date</label>
              <input type="date" id="task-due" class="input">
            </div>
          </div>
          <div class="form-group">
            <label class="label">Assignee</label>
            <select id="task-assignee-id" class="input select">
              <option value="">Unassigned</option>
              ${memberOptions}
            </select>
          </div>
          <div class="flex gap-md">
            <button type="submit" class="btn btn-primary flex-1">Create Task</button>
            <button type="button" class="btn btn-secondary" onclick="Utils.Modal.close()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    Utils.Modal.open(content);
    document.getElementById('create-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Tasks.handleCreate();
    });
  },
  
  async handleCreate() {
    const projectId = document.getElementById('task-project-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;
    const assignedTo = document.getElementById('task-assignee-id').value || null;
    const dueDate = document.getElementById('task-due').value || null;
    
    try {
      await API.createTask(projectId, {
        title,
        description,
        priority,
        assignedTo,
        dueDate
      });
      Utils.Modal.close();
      Utils.Toast.success('Task created!');
      // Refresh current project if viewing detail
      if (window.location.hash.includes('project')) {
        Projects.showDetail(projectId);
      }
    } catch (error) {
      console.error('Create task failed:', error);
    }
  },
  
  async updateStatus(taskId, status) {
    try {
      await API.updateTaskStatus(taskId, status);
      Utils.Toast.success('Status updated');
      // Refresh current view
      if (Tasks.currentProjectId) {
        Projects.showDetail(Tasks.currentProjectId);
      }
    } catch (error) {
      console.error('Status update failed:', error);
    }
  },
  
  renderKanban(projectId, tasks) {
    const columns = {
      todo: [],
      'in_progress': [],
      review: [],
      done: []
    };
    
    tasks.forEach(task => {
      columns[task.status].push(task);
    });
    
    return `
      <div class="kanban-board">
        ${Object.entries(columns).map(([status, taskList]) => `
          <div class="kanban-column">
            <div class="column-header">
              <span>${status.replace('_', ' ').toUpperCase()}</span>
              <span class="column-count">${taskList.length}</span>
            </div>
            <div class="space-y-sm">
              ${taskList.map(task => `
                <div class="task-card card p-md cursor-pointer" onclick="Tasks.showEditModal(${task.id})">
                  <div class="flex justify-between mb-xs">
                    <h5>${task.title}</h5>
                    ${Utils.renderBadge('priority', task.priority)}
                  </div>
                  ${task.description ? `<p class="text-sm text-muted mb-sm">${task.description}</p>` : ''}
                  <div class="flex gap-sm flex-wrap">
                    ${task.assigned_to_name ? `
                      <div class="flex items-center gap-xs text-xs">
                        <div class="w-3 h-3 bg-primary rounded-full"></div>
                        ${task.assigned_to_name}
                      </div>
                    ` : ''}
                    ${task.due_date ? `<span class="text-xs">${Utils.formatDate(task.due_date)}</span>` : ''}
                  </div>
                  <div class="flex gap-sm mt-sm pt-sm border-t border-muted/30">
                    <select onclick="event.stopPropagation()" onchange="Tasks.updateStatus(${task.id}, this.value)" class="text-xs bg-transparent border-none">
                      <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>📝 To Do</option>
                      <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>🔄 In Progress</option>
                      <option value="review" ${task.status === 'review' ? 'selected' : ''}>👀 Review</option>
                      <option value="done" ${task.status === 'done' ? 'selected' : ''}>✅ Done</option>
                    </select>
                    <button class="btn btn-sm btn-danger ml-auto" onclick="event.stopPropagation(); Tasks.deleteTask(${task.id})">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  async showEditModal(taskId) {
    // Fetch task and show edit form
    const data = await API.getTask(taskId);
    const task = data.task;
    Tasks.currentProjectId = task.project_id;
    const memberData = await API.getProjectMembers(task.project_id);
    const memberOptions = memberData.members.map(member => `
      <option value="${member.user_id}" ${task.assigned_to === member.user_id ? 'selected' : ''}>${member.name} (${member.email})</option>
    `).join('');
      
    const content = `
      <div class="card p-xl">
        <h3>Edit Task</h3>
        <form id="edit-task-form">
          <input type="hidden" id="edit-task-id" value="${taskId}">
          <div class="form-group">
            <label class="label">Title</label>
            <input type="text" id="edit-task-title" class="input" value="${task.title}" required>
          </div>
          <div class="form-group">
            <label class="label">Description</label>
            <textarea id="edit-task-desc" class="input textarea" rows="4">${task.description || ''}</textarea>
          </div>
          <div class="grid gap-md grid-cols-2">
            <div class="form-group">
              <label class="label">Priority</label>
              <select id="edit-task-priority" class="input select">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Status</label>
              <select id="edit-task-status" class="input select">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
              </select>
            </div>
          </div>
          <div class="grid gap-md grid-cols-2">
            <div class="form-group">
              <label class="label">Assignee</label>
              <select id="edit-task-assignee-id" class="input select">
                <option value="">Unassigned</option>
                ${memberOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="label">Due Date</label>
              <input type="date" id="edit-task-due" class="input" value="${task.due_date || ''}">
            </div>
          </div>
          <div class="flex gap-md">
            <button type="submit" class="btn btn-primary flex-1">Update Task</button>
            <button type="button" class="btn btn-secondary" onclick="Utils.Modal.close()">Cancel</button>
          </div>
        </form>
      </div>
    `;
      
    Utils.Modal.open(content);
    document.getElementById('edit-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Tasks.handleEdit(taskId);
    });
  },
  
  async handleEdit(taskId) {
    const title = document.getElementById('edit-task-title').value;
    const description = document.getElementById('edit-task-desc').value;
    const priority = document.getElementById('edit-task-priority').value;
    const status = document.getElementById('edit-task-status').value;
    const assignedTo = document.getElementById('edit-task-assignee-id').value || null;
    const dueDate = document.getElementById('edit-task-due')?.value || null;
    
    try {
      await API.updateTask(taskId, {
        title,
        description,
        priority,
        status,
        assignedTo,
        dueDate
      });
      Utils.Modal.close();
      Utils.Toast.success('Task updated!');
      // Refresh project detail
      if (Tasks.currentProjectId) {
        Projects.showDetail(Tasks.currentProjectId);
      }
    } catch (error) {
      console.error('Edit task failed:', error);
    }
  },
  
  async deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    try {
      await API.deleteTask(taskId);
      Utils.Toast.success('Task deleted');
      // Refresh current project
      if (Tasks.currentProjectId) {
        Projects.showDetail(Tasks.currentProjectId);
      }
    } catch (error) {
      console.error('Delete task failed:', error);
    }
  }
};

