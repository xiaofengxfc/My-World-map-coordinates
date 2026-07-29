/* ==========================================
   数据管理模块 - localStorage 存储
   ========================================== */

const STORAGE_KEY = 'mc_coords_data';

// ---- 数据结构 ----
/*
{
  worlds: [{ id, name, icon, createdAt }],
  categories: [{ id, name, color, icon }],
  locations: [{ id, worldId, name, dimension, x, y, z, category, description, color, createdAt, updatedAt }],
  version: 1
}
*/

// ---- 初始数据 ----
function createInitialData() {
  return {
    worlds: getDefaultWorlds(),
    categories: getDefaultCategories(),
    locations: [],
    version: 1
  };
}

// ---- 数据存储对象 ----
const DataStore = {
  _data: null,

  // 初始化 / 加载数据
  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._data = JSON.parse(raw);
        // 版本迁移
        if (!this._data.version) this._data.version = 1;
        // 兼容性修复
        if (!this._data.worlds) this._data.worlds = getDefaultWorlds();
        if (!this._data.categories) this._data.categories = getDefaultCategories();
        if (!this._data.locations) this._data.locations = [];
      } catch(e) {
        console.error('数据解析失败，使用初始数据', e);
        this._data = createInitialData();
      }
    } else {
      this._data = createInitialData();
      this.save();
    }
    return this._data;
  },

  // 保存到 localStorage
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      return true;
    } catch(e) {
      console.error('保存数据失败:', e);
      showToast('存储空间已满，请导出数据后清理', 'error', 5000);
      return false;
    }
  },

  // 获取完整数据
  getAll() { return this._data; },

  // ---- 世界操作 ----
  getWorlds() { return this._data.worlds; },

  getWorld(id) {
    return this._data.worlds.find(w => w.id === id);
  },

  addWorld(name, icon = '🌍') {
    const world = { id: generateId(), name, icon, createdAt: Date.now() };
    this._data.worlds.push(world);
    this.save();
    return world;
  },

  updateWorld(id, updates) {
    const idx = this._data.worlds.findIndex(w => w.id === id);
    if (idx === -1) return null;
    this._data.worlds[idx] = { ...this._data.worlds[idx], ...updates };
    this.save();
    return this._data.worlds[idx];
  },

  deleteWorld(id) {
    // 删除世界同时删除其所有坐标
    this._data.locations = this._data.locations.filter(l => l.worldId !== id);
    this._data.worlds = this._data.worlds.filter(w => w.id !== id);
    this.save();
  },

  // ---- 分类操作 ----
  getCategories() { return this._data.categories; },

  getCategory(id) {
    return this._data.categories.find(c => c.id === id);
  },

  addCategory(name, color, icon = '📌') {
    const cat = { id: generateId(), name, color, icon };
    this._data.categories.push(cat);
    this.save();
    return cat;
  },

  updateCategory(id, updates) {
    const idx = this._data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this._data.categories[idx] = { ...this._data.categories[idx], ...updates };
    this.save();
    return this._data.categories[idx];
  },

  deleteCategory(id) {
    // 将该分类下的坐标设为未分类
    this._data.locations.forEach(l => {
      if (l.category === id) l.category = '';
    });
    this._data.categories = this._data.categories.filter(c => c.id !== id);
    this.save();
  },

  // ---- 坐标操作 ----
  getLocations(filters = {}) {
    let list = [...this._data.locations];
    if (filters.worldId) list = list.filter(l => l.worldId === filters.worldId);
    if (filters.dimension && filters.dimension !== 'all') list = list.filter(l => l.dimension === filters.dimension);
    if (filters.category && filters.category !== 'all') list = list.filter(l => l.category === filters.category);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        `${l.x} ${l.y} ${l.z}`.includes(q)
      );
    }
    if (filters.sort) {
      switch(filters.sort) {
        case 'oldest': list.sort((a, b) => a.createdAt - b.createdAt); break;
        case 'name': list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')); break;
        case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN')); break;
        default: list.sort((a, b) => b.createdAt - a.createdAt); break; // newest
      }
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  },

  getLocation(id) {
    return this._data.locations.find(l => l.id === id);
  },

  addLocation({ worldId, name, dimension, x, y, z, category = '', description = '' }) {
    const loc = {
      id: generateId(),
      worldId,
      name: name.trim(),
      dimension,
      x: parseFloat(x),
      y: y !== '' && y !== null ? parseFloat(y) : 64,
      z: parseFloat(z),
      category,
      description: description.trim(),
      color: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this._data.locations.push(loc);
    this.save();
    return loc;
  },

  updateLocation(id, updates) {
    const idx = this._data.locations.findIndex(l => l.id === id);
    if (idx === -1) return null;
    updates.updatedAt = Date.now();
    if (updates.name) updates.name = updates.name.trim();
    if (updates.description) updates.description = updates.description.trim();
    if (updates.x !== undefined) updates.x = parseFloat(updates.x);
    if (updates.y !== undefined) updates.y = updates.y !== '' ? parseFloat(updates.y) : 64;
    if (updates.z !== undefined) updates.z = parseFloat(updates.z);
    this._data.locations[idx] = { ...this._data.locations[idx], ...updates };
    this.save();
    return this._data.locations[idx];
  },

  deleteLocation(id) {
    this._data.locations = this._data.locations.filter(l => l.id !== id);
    this.save();
  },

  // ---- 统计 ----
  getStats() {
    return {
      totalLocations: this._data.locations.length,
      totalWorlds: this._data.worlds.length,
    };
  },

  // ---- 坐标数统计（按世界）----
  getLocationCount(worldId) {
    return this._data.locations.filter(l => l.worldId === worldId).length;
  },

  getLocationCountByCategory(categoryId) {
    return this._data.locations.filter(l => l.category === categoryId).length;
  },

  // ---- 导出 ----
  exportJSON() {
    return JSON.stringify(this._data, null, 2);
  },

  exportCSV() {
    const cats = this.getCategories();
    const worlds = this.getWorlds();
    const headers = ['名称','世界','维度','X','Y','Z','分类','描述','创建时间'];
    const rows = this._data.locations.map(l => {
      const world = worlds.find(w => w.id === l.worldId);
      const cat = cats.find(c => c.id === l.category);
      return [
        `"${l.name}"`,
        `"${world ? world.name : '未知'}"`,
        dimensionName(l.dimension),
        l.x, l.y, l.z,
        `"${cat ? cat.name : ''}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        formatTime(l.createdAt)
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  },

  // ---- 导入 ----
  importJSON(jsonStr, mode = 'merge') {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.locations || !Array.isArray(data.locations)) {
        return { success: false, error: '无效的数据格式' };
      }

      if (mode === 'replace') {
        this._data = data;
        if (!this._data.worlds) this._data.worlds = getDefaultWorlds();
        if (!this._data.categories) this._data.categories = getDefaultCategories();
        this._data.version = 1;
      } else {
        // merge: 合并
        const existingIds = new Set(this._data.locations.map(l => l.id));
        const newLocs = data.locations.filter(l => !existingIds.has(l.id));
        this._data.locations.push(...newLocs);

        // 合并世界（按 id 去重）
        const existingWorldIds = new Set(this._data.worlds.map(w => w.id));
        for (const w of (data.worlds || [])) {
          if (!existingWorldIds.has(w.id)) {
            this._data.worlds.push(w);
            existingWorldIds.add(w.id);
          }
        }

        // 合并分类
        const existingCatIds = new Set(this._data.categories.map(c => c.id));
        for (const c of (data.categories || [])) {
          if (!existingCatIds.has(c.id)) {
            this._data.categories.push(c);
            existingCatIds.add(c.id);
          }
        }
      }

      this.save();
      return { success: true, count: this._data.locations.length };
    } catch(e) {
      return { success: false, error: 'JSON 解析失败: ' + e.message };
    }
  },

  // ---- 清空所有数据 ----
  clearAll() {
    this._data = createInitialData();
    this.save();
  }
};
