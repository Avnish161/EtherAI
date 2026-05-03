/**
 * Etharaai - Dashboard Module
 * Stats cards, recent tasks, my tasks
 */

const Dashboard = {
  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="loading"></div>';
    
    try {
      const data = await API.getDashboard();
      content.innerHTML = this.renderStats(data.stats);
      content.innerHTML += this.renderRecentTasks(data.recentTasks);
      content.innerHTML += this.renderMyTasks(data.myTasks);
    } catch (error) {
      content.innerHTML = '<div class="text-muted">Failed to load dashboard</div>';
    }
  },
  
  renderStats(stats) {
    const progress = Math.round((stats.tasksDone / Math.max(stats.totalTasks, 1)) * 100);
    
    return `
      <div>
        <div class="header">
          <h1>Dashboard</h1>
          <div class="text-muted">Welcome back, ${window.currentUser.name}</div>
        </div>
        
        <div class="stats-grid">
          <div class="card">
            <h3>${stats.totalProjects}</h3>
            <div class="text-muted">Total Projects</div>
          </div>
          <div class="card">
            <h3>${stats.totalTasks}</h3>
            <div class="text-muted">Total Tasks</div>
          </div>
          <div class="card">
            <h3>${stats.tasksInProgress}</h3>
            <div class="text-muted">In Progress</div>
          </div>
          <div class="card">
            <h3>${stats.overdueTasks}</h3>
            <div class="text-muted">Overdue</div>
          </div>
          <div class="card">
            <h3>${stats.myTasks}</h3>
            <div class="text-muted">My Tasks</div>
          </div>
          <div class="card">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="text-sm mt-sm">${progress}% Complete</div>
          </div>
        </div>
      </div>
    `;
  },
  
  renderRecentTasks(tasks) {
    if (!tasks.length) return '<div class="text-muted mt-xl">No recent activity</div>';
    
    return `
      <div class="card mt-xl">
        <h3>Recent Activity</h3>
        <div class="grid gap-md mt-md">
          ${tasks.map(task => `
            <div class="flex items-center gap-md p-md bg-bg-secondary rounded-md">
              <div class="text-xs">${Utils.formatDate(task.created_at)}</div>
              <div class="flex-1">
                <div><strong>${task.title}</strong></div>
                <div class="text-muted text-xs">${task.project_name}</div>
              </div>
              ${Utils.renderBadge('status', task.status)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  renderMyTasks(tasks) {
    if (!tasks.length) return '';
    
    return `
      <div class="card mt-xl">
        <h3>My Assigned Tasks</h3>
        <div class="grid gap-md mt-md">
          ${tasks.map(task => `
            <div class="task-card p-lg">
              <div class="flex justify-between items-start mb-sm">
                <h4>${task.title}</h4>
                ${Utils.renderBadge('priority', task.priority)}
              </div>
              <div class="text-muted mb-sm">${task.project_name}</div>
              ${task.due_date ? `<div class="text-sm">Due: ${Utils.formatDate(task.due_date)}</div>` : ''}
              <div class="flex gap-sm mt-sm">
                ${Utils.renderBadge('status', task.status)}
                <button class="btn btn-sm btn-secondary">View</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};

