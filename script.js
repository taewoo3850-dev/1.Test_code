class EmailJSManager {
  constructor() {
    this.publicKey = 'RIWA5p0W_K2M3aXq3';
    this.serviceId = 'service_8wop1bk';
    this.templateId = 'template_hjyo2pc';
    this.init();
  }

  init() {
    this.setupContactForm();

    if (typeof emailjs === 'undefined') {
      console.error('EmailJS 라이브러리 로드 실패: CDN 스크립트를 확인하세요.');
      return;
    }
    emailjs.init(this.publicKey);
  }

  setupContactForm() {
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  handleSubmit(e) {
    e.preventDefault();

    if (typeof emailjs === 'undefined') {
      alert('이메일 서비스를 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해주세요.');
      console.error('EmailJS is undefined - CDN script failed to load.');
      return;
    }

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    const templateParams = {
      name: name,
      email: email,
      title: subject,
      message: message
    };

    emailjs.send(this.serviceId, this.templateId, templateParams).then(
      (response) => {
        alert('문의가 전송되었습니다! 감사합니다 😊');
        document.getElementById('contactForm').reset();
      },
      (error) => {
        alert('문의 전송에 실패했습니다. 다시 시도해주세요.');
        console.error('EmailJS Error:', error);
      }
    );
  }
}

class ThemeManager {
  constructor() {
    this.theme = this.loadTheme();
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupEventListener();
  }

  loadTheme() {
    return localStorage.getItem('theme') || 'dark';
  }

  saveTheme(theme) {
    localStorage.setItem('theme', theme);
  }

  applyTheme() {
    const isDark = this.theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    this.updateToggleButton();
  }

  updateToggleButton() {
    const toggle = document.getElementById('themeToggle');
    toggle.querySelector('.toggle-icon').textContent = this.theme === 'dark' ? '☀️' : '🌙';
  }

  setupEventListener() {
    const toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', () => this.toggle());
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.saveTheme(this.theme);
    this.applyTheme();
  }
}

class PhotoModalManager {
  constructor(themeManager) {
    this.themeManager = themeManager;
    this.modal = document.getElementById('photoModal');
    this.image = document.getElementById('photoModalImage');
    this.titleEl = document.getElementById('photoModalTitle');
    this.commentsSlot = document.getElementById('photoModalCommentsSlot');
    this.closeBtn = document.getElementById('photoModalClose');
    this.overlay = document.getElementById('photoModalOverlay');
    this.currentPhotoId = null;
    this.avatarColors = ['#FF6B6B', '#4ECDC4', '#556FB5', '#F7B32B', '#9B5DE5', '#00BBF9'];
    this.init();
  }

  init() {
    this.setupGalleryClicks();
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  setupGalleryClicks() {
    const items = document.querySelectorAll('.gallery-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const photoId = item.dataset.photoId;
        const photoTitle = item.dataset.photoTitle;
        const imgSrc = item.querySelector('img').src;
        this.open(photoId, imgSrc, photoTitle);
      });
    });
  }

  open(photoId, imgSrc, photoTitle) {
    this.currentPhotoId = photoId;
    this.image.src = imgSrc;
    this.image.alt = photoTitle;
    this.titleEl.textContent = `${photoTitle} 댓글`;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderCommentUI();
    this.loadComments();
  }

  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  avatarColorFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }

  renderCommentUI() {
    const savedName = localStorage.getItem('commentName') || '';
    this.commentsSlot.innerHTML = `
      <div class="comment-list" id="commentList"><p class="comment-loading">불러오는 중...</p></div>
      <form class="comment-form" id="commentForm">
        <input type="text" id="commentName" class="comment-name-input" placeholder="이름" required maxlength="20" value="${this.escapeHtml(savedName)}">
        <div class="comment-input-row">
          <input type="text" id="commentMessage" class="comment-message-input" placeholder="댓글 달기..." required maxlength="300">
          <button type="submit" class="comment-send-btn">전송</button>
        </div>
      </form>
    `;

    const form = document.getElementById('commentForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async loadComments() {
    const list = document.getElementById('commentList');

    try {
      const res = await fetch(`/api/comments?photo=${encodeURIComponent(this.currentPhotoId)}`);
      const comments = await res.json();
      this.renderComments(comments);
    } catch (err) {
      list.innerHTML = '<p class="comment-loading">댓글을 불러오지 못했습니다.</p>';
      console.error('Load comments error:', err);
    }
  }

  renderComments(comments) {
    const list = document.getElementById('commentList');

    if (!comments || comments.length === 0) {
      list.innerHTML = '<p class="no-comments">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>';
      return;
    }

    list.innerHTML = comments.map((c) => {
      const date = new Date(c.createdAt);
      const dateStr = date.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const initial = c.name.charAt(0).toUpperCase();
      const color = this.avatarColorFor(c.name);
      return `
        <div class="comment-item">
          <div class="comment-avatar-circle" style="background:${color}">${this.escapeHtml(initial)}</div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-name">${this.escapeHtml(c.name)}</span>
              <span class="comment-date">${dateStr}</span>
            </div>
            <p class="comment-text">${this.escapeHtml(c.message)}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  async handleSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('commentName');
    const messageInput = document.getElementById('commentMessage');
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    const submitBtn = e.target.querySelector('.comment-send-btn');
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: this.currentPhotoId, name, message })
      });
      const comments = await res.json();
      this.renderComments(comments);
      messageInput.value = '';
      localStorage.setItem('commentName', name);
    } catch (err) {
      alert('댓글 전송에 실패했습니다. 다시 시도해주세요.');
      console.error('Submit comment error:', err);
    } finally {
      submitBtn.disabled = false;
    }
  }
}

class DateRecorder {
  constructor() {
    this.dates = this.loadDates();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    const form = document.getElementById('dateForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  loadDates() {
    const saved = localStorage.getItem('dateRecords');
    return saved ? JSON.parse(saved) : [];
  }

  saveDates() {
    localStorage.setItem('dateRecords', JSON.stringify(this.dates));
  }

  handleSubmit(e) {
    e.preventDefault();

    const dateInput = document.getElementById('dateInput').value;
    const location = document.getElementById('locationInput').value;
    const description = document.getElementById('descriptionInput').value;
    const mood = document.getElementById('moodInput').value;

    if (!dateInput || !location || !mood) {
      alert('필수 항목을 모두 입력해주세요!');
      return;
    }

    const newRecord = {
      id: Date.now(),
      date: dateInput,
      location: location,
      description: description,
      mood: mood,
      createdAt: new Date().toISOString()
    };

    this.dates.unshift(newRecord);
    this.saveDates();
    this.render();
    this.resetForm();
  }

  deleteRecord(id) {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      this.dates = this.dates.filter(record => record.id !== id);
      this.saveDates();
      this.render();
    }
  }

  resetForm() {
    document.getElementById('dateForm').reset();
  }

  render() {
    this.renderRecords();
    this.updateStats();
  }

  renderRecords() {
    const recordsList = document.getElementById('recordsList');

    if (this.dates.length === 0) {
      recordsList.innerHTML = '<p class="no-records">아직 기록이 없습니다. 첫 데이트를 기록해보세요!</p>';
      return;
    }

    recordsList.innerHTML = this.dates.map(record => {
      const dateObj = new Date(record.date);
      const formattedDate = dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return `
        <div class="record-item">
          <div class="record-info">
            <div class="record-date">${formattedDate}</div>
            <div class="record-location">📍 ${record.location}</div>
            ${record.description ? `<div class="record-description">${record.description}</div>` : ''}
          </div>
          <div class="record-actions">
            <div class="record-mood">${record.mood}</div>
            <button class="record-delete" onclick="dateRecorder.deleteRecord(${record.id})">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateStats() {
    const totalDates = this.dates.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthDates = this.dates.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;

    const locationCounts = {};
    this.dates.forEach(record => {
      locationCounts[record.location] = (locationCounts[record.location] || 0) + 1;
    });

    let favoriteLocation = '-';
    if (Object.keys(locationCounts).length > 0) {
      favoriteLocation = Object.keys(locationCounts).reduce((a, b) =>
        locationCounts[a] > locationCounts[b] ? a : b
      );
    }

    document.getElementById('totalDates').textContent = totalDates;
    document.getElementById('monthDates').textContent = monthDates;
    document.getElementById('favoriteLocation').textContent = favoriteLocation;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const emailJSManager = new EmailJSManager();
  const themeManager = new ThemeManager();
  const photoModalManager = new PhotoModalManager(themeManager);
  const dateRecorder = new DateRecorder();

  window.dateRecorder = dateRecorder;
});
