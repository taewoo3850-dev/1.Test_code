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
          <div style="display: flex; gap: 10px; align-items: start;">
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

const dateRecorder = new DateRecorder();
