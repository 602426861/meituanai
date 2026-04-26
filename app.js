const STORAGE_KEY = "medication_manager_data_v1";

const state = {
  profile: null,
  medicines: []
};

const profileForm = document.getElementById("profile-form");
const profileSummary = document.getElementById("profile-summary");
const medicineForm = document.getElementById("medicine-form");
const medicineList = document.getElementById("medicine-list");
const todayReminders = document.getElementById("today-reminders");
const renewalReminders = document.getElementById("renewal-reminders");
const medicineTemplate = document.getElementById("medicine-item-template");

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    state.profile = data.profile ?? null;
    state.medicines = Array.isArray(data.medicines) ? data.medicines : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateProfileSummary() {
  if (!state.profile) {
    profileSummary.textContent = "尚未保存档案。";
    return;
  }

  const { name, condition, doctor, reviewDays, lastReviewDate } = state.profile;
  const nextReview = addDays(lastReviewDate, Number(reviewDays));
  profileSummary.textContent = `${name}｜${condition}｜随访医生：${doctor}｜下次建议复诊：${nextReview}`;
}

function renderMedicines() {
  medicineList.innerHTML = "";
  if (state.medicines.length === 0) {
    medicineList.innerHTML = '<li class="hint">还没有添加药品计划。</li>';
    return;
  }

  state.medicines.forEach((med) => {
    const node = medicineTemplate.content.cloneNode(true);
    node.querySelector(".medicine-title").textContent = med.name;
    node.querySelector(".medicine-meta").textContent = `剂量：${med.dose}；每日 ${med.timesPerDay} 次；库存 ${med.stockDays} 天`;

    node.querySelector(".btn-check").addEventListener("click", () => {
      med.lastTakenDate = today();
      saveState();
      renderReminders();
    });

    node.querySelector(".btn-remove").addEventListener("click", () => {
      state.medicines = state.medicines.filter((item) => item.id !== med.id);
      saveState();
      renderAll();
    });

    medicineList.appendChild(node);
  });
}

function renderReminders() {
  todayReminders.innerHTML = "";
  renewalReminders.innerHTML = "";

  if (state.medicines.length === 0) {
    todayReminders.innerHTML = '<p class="hint">暂无提醒，先添加药品计划吧。</p>';
    renewalReminders.innerHTML = '<p class="hint">暂无续方提醒。</p>';
    return;
  }

  state.medicines.forEach((med) => {
    const takenText = med.lastTakenDate === today() ? "今日已打卡服药 ✅" : "今日尚未打卡服药";
    appendReminder(todayReminders, `${med.name}：建议按计划服用（${med.timesPerDay} 次/天）。${takenText}`);

    const refillDate = addDays(med.createdAt, Number(med.stockDays));
    appendReminder(renewalReminders, `${med.name}：预计 ${refillDate} 库存见底，请提前问诊续方并购药。`);
  });

  if (state.profile) {
    const nextReview = addDays(state.profile.lastReviewDate, Number(state.profile.reviewDays));
    appendReminder(renewalReminders, `复诊提醒：建议在 ${nextReview} 前完成线上复诊并续方。`);
  }
}

function appendReminder(container, text) {
  const p = document.createElement("p");
  p.className = "reminder";
  p.textContent = text;
  container.appendChild(p);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.profile = {
    name: document.getElementById("name").value.trim(),
    condition: document.getElementById("condition").value.trim(),
    doctor: document.getElementById("doctor").value.trim(),
    reviewDays: Number(document.getElementById("review-days").value),
    lastReviewDate: today()
  };
  saveState();
  updateProfileSummary();
  renderReminders();
});

medicineForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const medicine = {
    id: crypto.randomUUID(),
    name: document.getElementById("medicine-name").value.trim(),
    dose: document.getElementById("dose").value.trim(),
    timesPerDay: Number(document.getElementById("times-per-day").value),
    stockDays: Number(document.getElementById("stock-days").value),
    createdAt: today(),
    lastTakenDate: ""
  };

  state.medicines.push(medicine);
  medicineForm.reset();
  document.getElementById("times-per-day").value = 2;
  document.getElementById("stock-days").value = 14;

  saveState();
  renderAll();
});

function renderAll() {
  updateProfileSummary();
  renderMedicines();
  renderReminders();
}

loadState();
renderAll();
