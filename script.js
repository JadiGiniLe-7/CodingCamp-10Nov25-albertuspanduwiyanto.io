const $ = id => document.getElementById(id);
const todoText = $('todoText');
const todoDate = $('todoDate');
const addBtn = $('addBtn');
const tableBody = $('tableBody');
const deleteAllBtn = $('deleteAllBtn');
const filterBtn = $('filterBtn');
const filterPopup = document.getElementById('filterPopup');

let todos = []; // {id, text, due (ISO), done (bool)}
let filter = 'all'; // all | pending | completed
let editingId = null;

function save() {
  localStorage.setItem('todos_v1', JSON.stringify(todos));
}

function load() {
  const raw = localStorage.getItem('todos_v1');
  if(raw) {
    try { todos = JSON.parse(raw); }
    catch(e){ todos = []; }
  }
}
function uid(){ return Math.random().toString(36).slice(2,9); }

function formatDateISO(iso){
  if(!iso) return '-';
  const d = new Date(iso);
  if(isNaN(d)) return '-';
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const yy = String(d.getFullYear());
  return mm + '/' + dd + '/' + yy;
}

function render(){
  // clear
  tableBody.innerHTML = '';

  // apply filter
  let items = todos.slice().sort((a,b)=>{
    // first by done, then by due date soonest
    if(a.done !== b.done) return a.done - b.done;
    return new Date(a.due || 0) - new Date(b.due || 0);
  });
  if(filter === 'pending') items = items.filter(t => !t.done);
  else if(filter === 'completed') items = items.filter(t => t.done);

  if(items.length === 0){
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'empty';
    td.textContent = 'No task found';
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }

  items.forEach(task => {
    const tr = document.createElement('tr');

    // Task cell
    const tdTask = document.createElement('td');
    const title = document.createElement('div');
    title.style.fontWeight = 700;
    title.style.marginBottom = '6px';
    title.textContent = task.text;
    const sub = document.createElement('div');
    sub.className = 'muted';
    sub.textContent = 'ID: ' + task.id;
    tdTask.appendChild(title);
    tdTask.appendChild(sub);

    // Due date
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDateISO(task.due);

    // Status
    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status-badge ' + (task.done ? 'status-done' : 'status-pending');
    badge.textContent = task.done ? 'Completed' : 'Pending';
    tdStatus.appendChild(badge);

    // Actions
    const tdAct = document.createElement('td');
    tdAct.className = 'action-icons';

    const completeBtn = document.createElement('button');
    completeBtn.className = 'icon-btn';
    completeBtn.title = task.done ? 'Mark as pending' : 'Mark as done';
    completeBtn.innerHTML = task.done ? doneIcon() : checkIcon();
    completeBtn.addEventListener('click', () => {
      task.done = !task.done;
      save();
      render();
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit';
    editBtn.innerHTML = editIcon();
    editBtn.addEventListener('click', () => {
      editingId = task.id;
      todoText.value = task.text;
      // set date input to ISO yyyy-mm-dd (input[type=date] expects)
      todoDate.value = task.due ? new Date(task.due).toISOString().slice(0,10) : '';
      todoText.focus();
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.title = 'Delete';
    delBtn.innerHTML = trashIcon();
    delBtn.addEventListener('click', () => {
      if(!confirm('Delete this task?')) return;
      todos = todos.filter(t => t.id !== task.id);
      save();
      render();
    });

    tdAct.appendChild(completeBtn);
    tdAct.appendChild(editBtn);
    tdAct.appendChild(delBtn);

    tr.appendChild(tdTask);
    tr.appendChild(tdDate);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAct);

    tableBody.appendChild(tr);
  });
}

/* Icons as functions returning SVG strings */
function checkIcon(){
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function doneIcon(){
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#9b79ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function editIcon(){
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
}
function trashIcon(){
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}

addBtn.addEventListener('click', () => {
  const text = todoText.value.trim();
  const dateVal = todoDate.value ? new Date(todoDate.value).toISOString() : null;

  if(!text){
    // quick shake feedback
    todoText.style.boxShadow = '0 0 0 3px rgba(155,121,255,0.12)';
    setTimeout(()=> todoText.style.boxShadow = '', 400);
    return;
  }

  if(editingId){
    // update existing
    const idx = todos.findIndex(t => t.id === editingId);
    if(idx !== -1){
      todos[idx].text = text;
      todos[idx].due = dateVal;
      // keep done state
      editingId = null;
    }
    addBtn.title = 'Add todo';
  } else {
    // new
    const newTodo = { id: uid(), text, due: dateVal, done:false };
    todos.push(newTodo);
  }

  // clear UI
  todoText.value = '';
  todoDate.value = '';
  save();
  render();
});

// allow Enter to add
todoText.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') addBtn.click();
});

deleteAllBtn.addEventListener('click', () => {
  if(todos.length === 0) return alert('No tasks to delete.');
  if(confirm('Delete ALL tasks? This cannot be undone.')){
    todos = [];
    save();
    render();
  }
});

/* Filter popup handling */
filterBtn.addEventListener('click', (ev) => {
  const rect = filterBtn.getBoundingClientRect();
  filterPopup.style.left = (rect.left) + 'px';
  filterPopup.style.top = (rect.bottom + 8) + 'px';
  filterPopup.style.display = 'block';
});

// clicking outside closes popup
document.addEventListener('click', (e) => {
  if(!filterPopup.contains(e.target) && e.target !== filterBtn){
    filterPopup.style.display = 'none';
  }
});

filterPopup.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const sel = btn.getAttribute('data-filter');
  if(sel){
    filter = sel;
    filterPopup.style.display = 'none';
    // update label on filter button
    filterBtn.textContent = 'FILTER ▾ (' + filter.charAt(0).toUpperCase() + filter.slice(1) + ')';
    render();
  }
});

/* initial load */
load();
render();

/* small UX: show existing filter label */
filterBtn.textContent = 'FILTER ▾ (All)';

/* helpful: populate sample tasks if none exist (comment out if undesired) */
/*
if(todos.length === 0){
  todos.push({id:uid(), text:'Example: Finish project plan', due:new Date(Date.now()+86400000).toISOString(), done:false});
  todos.push({id:uid(), text:'Pay electricity bill', due:new Date(Date.now()+3*86400000).toISOString(), done:false});
  todos.push({id:uid(), text:'Read a book', due:null, done:true});
  save();
  render();
}
*/