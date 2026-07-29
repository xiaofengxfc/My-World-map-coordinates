/* ==========================================
   工具函数
   ========================================== */

// ---- UUID 生成 ----
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ---- 格式化时间 ----
function formatTime(timestamp) {
  const d = new Date(timestamp);
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---- 相对时间 ----
function relativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return formatTime(timestamp);
}

// ---- 下界坐标转换 ----
function netherToOverworld(x, z) {
  return { x: Math.round(x * 8), z: Math.round(z * 8) };
}
function overworldToNether(x, z) {
  return { x: Math.round(x / 8), z: Math.round(z / 8) };
}

// ---- 维度图标 ----
function dimensionIcon(dim) {
  switch(dim) {
    case 'overworld': return '🌳';
    case 'nether': return '🔥';
    case 'end': return '🌌';
    default: return '❓';
  }
}

function dimensionName(dim) {
  switch(dim) {
    case 'overworld': return '主世界';
    case 'nether': return '下界';
    case 'end': return '末地';
    default: return '未知';
  }
}

// ---- 默认数据 ----
function getDefaultCategories() {
  return [];
}

function getDefaultWorlds() {
  return [
    { id: generateId(), name: '主世界', icon: '🌍', createdAt: Date.now() },
  ];
}

// ---- Toast 通知 ----
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💡'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- 防抖 ----
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
