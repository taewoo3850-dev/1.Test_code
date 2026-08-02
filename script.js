class EmailJSManager {
  constructor() {
    this.publicKey = 'RIWA5p0W_K2M3aXq3';
    this.serviceId = 'service_8wop1bk';
    this.templateId = 'template_hjo2pc';
    this.init();
  }

  init() {
    emailjs.init(this.publicKey);
    this.setupContactForm();
  }

  setupContactForm() {
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  handleSubmit(e) {
    e.preventDefault();

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
  const dateRecorder = new DateRecorder();

  window.dateRecorder = dateRecorder;
});
