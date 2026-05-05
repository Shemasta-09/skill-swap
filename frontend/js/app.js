document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentUser = null;
  let allUsers = [];
  let isLoginMode = true;
  let activeChatUser = null;

  // DOM Elements
  const views = document.querySelectorAll('.view');
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  // Auth Elements
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authToggleText = document.getElementById('authToggleText');
  const authToggleLink = document.getElementById('authToggleLink');
  const signupOnlyElements = document.querySelectorAll('.signup-only');
  const authError = document.getElementById('authError');
  const logoutBtn = document.getElementById('logoutBtn');

  // Initialization
  init();

  async function init() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        currentUser = await api.auth.getUser();
        await loadInitialData();
        showView('dashboard');
      } catch (err) {
        localStorage.removeItem('token');
        showView('authView');
      }
    } else {
      showView('authView');
    }
    setupEventListeners();
  }

  // View Navigation
  function showView(viewId) {
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'authView') {
      navbar.style.display = 'none';
    } else {
      navbar.style.display = 'flex';
      updateNavLinks(viewId);
    }
  }

  function updateNavLinks(viewId) {
    navLinks.forEach(link => {
      if (link.dataset.view === viewId.replace('View', '')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Load Data
  async function loadInitialData() {
    allUsers = await api.auth.getAllUsers();
    renderDashboard();
    renderProfile();
    renderChatUsers();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showView(e.target.dataset.view + 'View');
      });
    });

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      currentUser = null;
      showView('authView');
    });

    // Auth Toggle
    authToggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      isLoginMode = !isLoginMode;
      
      if (isLoginMode) {
        authTitle.textContent = 'Welcome to SkillX';
        authSubtitle.textContent = 'Log in to continue';
        authSubmitBtn.textContent = 'Login';
        authToggleText.textContent = "Don't have an account?";
        authToggleLink.textContent = 'Sign up';
        signupOnlyElements.forEach(el => el.style.display = 'none');
        document.getElementById('name').required = false;
      } else {
        authTitle.textContent = 'Create an Account';
        authSubtitle.textContent = 'Join the skill exchange platform';
        authSubmitBtn.textContent = 'Sign Up';
        authToggleText.textContent = 'Already have an account?';
        authToggleLink.textContent = 'Log in';
        signupOnlyElements.forEach(el => el.style.display = 'block');
        document.getElementById('name').required = true;
      }
      authError.style.display = 'none';
    });

    // Auth Submit
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        let res;
        if (isLoginMode) {
          res = await api.auth.login({ email, password });
        } else {
          const name = document.getElementById('name').value;
          const skills_offered = document.getElementById('skillsOffered').value;
          const skills_wanted = document.getElementById('skillsWanted').value;
          res = await api.auth.register({ name, email, password, skills_offered, skills_wanted });
        }
        
        localStorage.setItem('token', res.token);
        currentUser = await api.auth.getUser();
        await loadInitialData();
        showView('dashboardView');
        authForm.reset();
        authError.style.display = 'none';
      } catch (err) {
        authError.textContent = err.message;
        authError.style.display = 'block';
      }
    });

    // Modal
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillModal = document.getElementById('skillModal');
    const closeSkillModal = document.getElementById('closeSkillModal');
    const skillForm = document.getElementById('skillForm');

    addSkillBtn.addEventListener('click', () => {
      skillModal.classList.add('active');
    });

    closeSkillModal.addEventListener('click', () => {
      skillModal.classList.remove('active');
    });

    skillForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const skillName = document.getElementById('skillName').value;
      const type = document.getElementById('skillType').value;

      try {
        await api.skills.add({ skill_name: skillName, type });
        skillModal.classList.remove('active');
        skillForm.reset();
        renderDashboard();
        renderProfile();
      } catch (err) {
        alert(err.message);
      }
    });



    // Messaging
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Render Functions
  async function renderDashboard() {
    const skillsGrid = document.getElementById('skillsGrid');
    try {
      const skills = await api.skills.getAll();
      skillsGrid.innerHTML = '';
      
      skills.forEach(skill => {
        if (!skill.user_id || skill.user_id._id === currentUser._id) return;

        const card = document.createElement('div');
        card.className = 'skill-card';
        card.innerHTML = `
          <span class="skill-badge badge-${skill.type}">${skill.type === 'offer' ? 'Offers' : 'Wants'}</span>
          <h3>${skill.skill_name}</h3>
          <div class="skill-user">
            <div class="avatar-sm">${skill.user_id.name.charAt(0)}</div>
            <div>
              <p style="margin: 0; color: #0f172a; font-weight: 500">${skill.user_id.name}</p>
              <a href="#" class="msg-btn" data-id="${skill.user_id._id}" style="font-size: 0.8rem; color: #6366f1;">Message</a>
            </div>
          </div>
        `;
        skillsGrid.appendChild(card);
      });

      // Add listener to msg buttons
      document.querySelectorAll('.msg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const userId = e.target.dataset.id;
          openChat(userId);
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  async function renderProfile() {
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0);


    try {
      const skills = await api.skills.getUserSkills(currentUser._id);
      const offeredList = document.getElementById('skillsOfferedList');
      const wantedList = document.getElementById('skillsWantedList');
      
      offeredList.innerHTML = '';
      wantedList.innerHTML = '';

      skills.forEach(skill => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${skill.skill_name}</span>
          <button class="delete-skill" data-id="${skill._id}" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
        `;
        if (skill.type === 'offer') offeredList.appendChild(li);
        else wantedList.appendChild(li);
      });

      document.querySelectorAll('.delete-skill').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if(confirm('Delete skill?')) {
            await api.skills.delete(id);
            renderProfile();
            renderDashboard();
          }
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  function renderChatUsers() {
    const list = document.getElementById('chatUsersList');
    list.innerHTML = '';
    
    allUsers.forEach(user => {
      if (user._id === currentUser._id) return;
      const div = document.createElement('div');
      div.className = 'user-item';
      div.innerHTML = `
        <div class="avatar-sm">${user.name.charAt(0)}</div>
        <span>${user.name}</span>
      `;
      div.addEventListener('click', () => {
        document.querySelectorAll('.user-item').forEach(u => u.classList.remove('active'));
        div.classList.add('active');
        openChat(user._id);
      });
      list.appendChild(div);
    });
  }

  async function openChat(userId) {
    showView('messagesView');
    activeChatUser = userId;
    const user = allUsers.find(u => u._id === userId);
    document.getElementById('chatHeader').textContent = `Chat with ${user.name}`;
    document.getElementById('chatInputArea').style.display = 'flex';
    
    // Select user in list
    document.querySelectorAll('.user-item').forEach(u => {
      if(u.textContent.includes(user.name)) u.classList.add('active');
      else u.classList.remove('active');
    });

    await loadMessages();
  }

  async function loadMessages() {
    if (!activeChatUser) return;
    try {
      const messages = await api.messages.getConversation(activeChatUser);
      const chatArea = document.getElementById('chatMessages');
      chatArea.innerHTML = '';

      messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.sender_id === currentUser._id ? 'sent' : 'received'}`;
        div.textContent = msg.message;
        chatArea.appendChild(div);
      });
      chatArea.scrollTop = chatArea.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !activeChatUser) return;

    try {
      await api.messages.send({ receiver_id: activeChatUser, message: text });
      input.value = '';
      await loadMessages();
    } catch (err) {
      console.error(err);
    }
  }

});
