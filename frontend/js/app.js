document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentUser = null;
  let allUsers = [];
  let allRequests = [];
  let requestStats = {};
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
        showView('dashboardView');
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
    await loadRequestsData();
    await loadRequestStats();
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
    document.getElementById('audioCallBtn').addEventListener('click', () => startCall('audio'));
    document.getElementById('videoCallBtn').addEventListener('click', () => startCall('video'));
    document.getElementById('endCallBtn').addEventListener('click', endCall);
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
              <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.35rem;">
                <a href="#" class="msg-btn" data-id="${skill.user_id._id}" style="font-size: 0.8rem; color: #6366f1;">Message</a>
                <button class="btn-secondary request-btn" data-skill="${skill._id}" data-user="${skill.user_id._id}" style="font-size: 0.75rem; padding: 0.35rem 0.7rem;">Request</button>
              </div>
            </div>
          </div>
        `;
        skillsGrid.appendChild(card);
      });

      document.querySelectorAll('.msg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const userId = e.target.dataset.id;
          openChat(userId);
        });
      });

      document.querySelectorAll('.request-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const receiver_id = e.target.dataset.user;
          const skill_id = e.target.dataset.skill;
          try {
            await api.requests.create({ receiver_id, skill_id });
            await loadRequestsData();
            await loadRequestStats();
            alert('Request sent successfully.');
          } catch (error) {
            alert(error.message || 'Unable to send request.');
          }
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRequestsData() {
    try {
      allRequests = await api.requests.getAll();
      renderRequestPanel();
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRequestStats() {
    try {
      requestStats = await api.requests.stats();
      renderRequestStats();
    } catch (err) {
      console.error(err);
    }
  }

  function renderRequestStats() {
    document.getElementById('totalRequests').textContent = requestStats.total || 0;
    document.getElementById('pendingRequests').textContent = requestStats.pending || 0;
    document.getElementById('acceptedRequests').textContent = requestStats.accepted || 0;
    document.getElementById('rejectedRequests').textContent = requestStats.rejected || 0;
    document.getElementById('completedExchanges').textContent = requestStats.completed || 0;

    const popular = document.getElementById('popularSkills');
    popular.innerHTML = '<h4>Popular Requested Skills</h4>';
    if (Array.isArray(requestStats.popularSkills) && requestStats.popularSkills.length) {
      requestStats.popularSkills.forEach(skill => {
        const item = document.createElement('div');
        item.textContent = `${skill.skill_name} — ${skill.count} requests`;
        popular.appendChild(item);
      });
    } else {
      popular.innerHTML += '<p>No popular skills yet.</p>';
    }
  }

  function renderRequestPanel() {
    const requestList = document.getElementById('requestList');
    requestList.innerHTML = '';

    if (!allRequests.length) {
      requestList.innerHTML = '<p>No requests yet. Request a skill from the dashboard.</p>';
      return;
    }

    allRequests.forEach(request => {
      const item = document.createElement('div');
      item.className = 'request-item';
      item.innerHTML = `
        <header>
          <strong>${request.skill_id?.skill_name || 'Skill request'}</strong>
          <span>${request.status.toUpperCase()}</span>
        </header>
        <p><strong>From:</strong> ${request.sender_id?.name || 'Unknown'}</p>
        <p><strong>To:</strong> ${request.receiver_id?.name || 'Unknown'}</p>
        <p><small>${new Date(request.createdAt).toLocaleString()}</small></p>
      `;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '0.5rem';
      actions.style.flexWrap = 'wrap';
      actions.style.marginTop = '0.75rem';

      if (request.receiver_id?._id === currentUser._id && request.status === 'pending') {
        const accept = document.createElement('button');
        accept.className = 'btn-primary';
        accept.textContent = 'Accept';
        accept.addEventListener('click', async () => {
          await api.requests.update(request._id, 'accepted');
          await loadRequestsData();
          await loadRequestStats();
        });

        const reject = document.createElement('button');
        reject.className = 'btn-secondary';
        reject.textContent = 'Reject';
        reject.addEventListener('click', async () => {
          await api.requests.update(request._id, 'rejected');
          await loadRequestsData();
          await loadRequestStats();
        });

        actions.appendChild(accept);
        actions.appendChild(reject);
      }

      if (!request.completed && request.status === 'accepted' && (request.sender_id?._id === currentUser._id || request.receiver_id?._id === currentUser._id)) {
        const complete = document.createElement('button');
        complete.className = 'btn-secondary';
        complete.textContent = 'Mark Completed';
        complete.addEventListener('click', async () => {
          await api.requests.complete(request._id);
          await loadRequestsData();
          await loadRequestStats();
        });
        actions.appendChild(complete);
      }

      if (request.completed) {
        const completedBadge = document.createElement('span');
        completedBadge.textContent = 'Completed';
        completedBadge.style.color = '#16a34a';
        completedBadge.style.fontWeight = '700';
        actions.appendChild(completedBadge);
      }

      item.appendChild(actions);
      requestList.appendChild(item);
    });
  }

  async function startCall(mode) {
    const callPanel = document.getElementById('callPanel');
    const localVideo = document.getElementById('localVideo');
    const callStatus = document.getElementById('callStatus');

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === 'video' ? { audio: true, video: true } : { audio: true }
      );

      localVideo.srcObject = stream;
      localVideo.style.display = mode === 'video' ? 'block' : 'none';
      callStatus.textContent = mode === 'video' ? 'Video call active' : 'Audio call active';
      callPanel.style.display = 'flex';
      localVideo.play();
      localVideo.dataset.callMode = mode;
    } catch (err) {
      alert('Unable to access media devices.');
      console.error(err);
    }
  }

  function endCall() {
    const callPanel = document.getElementById('callPanel');
    const localVideo = document.getElementById('localVideo');
    const stream = localVideo.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    callPanel.style.display = 'none';
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
        if (msg.message) {
          const textNode = document.createElement('p');
          textNode.textContent = msg.message;
          div.appendChild(textNode);
        }

        if (Array.isArray(msg.attachments)) {
          msg.attachments.forEach(att => {
            const attachmentWrapper = document.createElement('div');
            attachmentWrapper.style.marginTop = '0.75rem';

            if (att.type === 'image') {
              const img = document.createElement('img');
              img.src = att.url;
              img.alt = att.name;
              img.style.maxWidth = '220px';
              img.style.borderRadius = '12px';
              attachmentWrapper.appendChild(img);
            } else if (att.type === 'video') {
              const video = document.createElement('video');
              video.src = att.url;
              video.controls = true;
              video.style.maxWidth = '220px';
              video.style.borderRadius = '12px';
              attachmentWrapper.appendChild(video);
            } else if (att.type === 'audio') {
              const audio = document.createElement('audio');
              audio.src = att.url;
              audio.controls = true;
              attachmentWrapper.appendChild(audio);
            } else {
              const link = document.createElement('a');
              link.href = att.url;
              link.target = '_blank';
              link.textContent = att.name;
              attachmentWrapper.appendChild(link);
            }

            div.appendChild(attachmentWrapper);
          });
        }

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
    if (!activeChatUser || !text) return;

    try {
      await api.messages.send({
        receiver_id: activeChatUser,
        message: text
      });

      input.value = '';
      await loadMessages();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not send message. Please try again.');
    }
  }

});
