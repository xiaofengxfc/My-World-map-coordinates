/* ==========================================
   应用主逻辑 - UI 交互与渲染
   ========================================== */

const App = {
  _state: {
    currentWorldId: null,        // null = 全部世界
    currentDimension: 'all',
    currentCategory: 'all',
    currentSort: 'newest',
    currentView: 'card',         // card | list | map
    searchQuery: '',
    editingCoordId: null,
    editingWorldId: null,
    editingCategoryId: null,
    distFrom: null,              // 距离计算起点
    distTo: null,                // 距离计算终点
  },

  // ---- 初始化 ----
  init() {
    DataStore.init();
    this._cacheDOM();
    this._bindEvents();
    this._registerSW();
    this._setupIconPicker();
    this._setupColorPicker();
    this._setupFileImport();
    this._setupConverter();
    this._renderAll();
    showToast('欢迎使用坐标记录工具', 'info', 1500);
  },

  // ---- 注册 Service Worker ----
  _registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(reg => {
        console.log('SW 注册成功:', reg.scope);
      }).catch(err => {
        console.warn('SW 注册失败:', err);
      });
    }
  },

  // ---- 缓存 DOM 引用 ----
  _cacheDOM() {
    // 侧边栏
    this.$sidebar = document.getElementById('sidebar');
    this.$overlay = document.getElementById('overlay');
    this.$hamburger = document.getElementById('hamburger');
    this.$sidebarToggle = document.getElementById('sidebarToggle');
    this.$worldList = document.getElementById('worldList');
    this.$categoryList = document.getElementById('categoryList');
    this.$addWorldBtn = document.getElementById('addWorldBtn');
    this.$addCategoryBtn = document.getElementById('addCategoryBtn');

    // 顶栏
    this.$currentWorldName = document.getElementById('currentWorldName');
    this.$currentCount = document.getElementById('currentCount');
    this.$searchInput = document.getElementById('searchInput');
    this.$dimensionFilter = document.getElementById('dimensionFilter');
    this.$categoryFilter = document.getElementById('categoryFilter');
    this.$sortFilter = document.getElementById('sortFilter');
    this.$addCoordBtn = document.getElementById('addCoordBtn');
    this.$distCalcBtn = document.getElementById('distCalcBtn');

    // 距离计算器
    this.$distModal = document.getElementById('distModal');
    this.$distFromWorld = document.getElementById('distFromWorld');
    this.$distFromCoord = document.getElementById('distFromCoord');
    this.$distFromDisplay = document.getElementById('distFromDisplay');
    this.$distToWorld = document.getElementById('distToWorld');
    this.$distToCoord = document.getElementById('distToCoord');
    this.$distToDisplay = document.getElementById('distToDisplay');
    this.$distResult = document.getElementById('distResult');
    this.$distStraight = document.getElementById('distStraight');
    this.$distHorizontal = document.getElementById('distHorizontal');
    this.$distVertical = document.getElementById('distVertical');
    this.$distChunks = document.getElementById('distChunks');

    // 视图
    this.$viewTabs = document.querySelectorAll('.view-tab');
    this.$contentArea = document.getElementById('contentArea');
    this.$emptyState = document.getElementById('emptyState');
    this.$emptyAddBtn = document.getElementById('emptyAddBtn');
    this.$fabBtn = document.getElementById('fabBtn');

    // 统计
    this.$statTotal = document.getElementById('statTotal');
    this.$statWorlds = document.getElementById('statWorlds');

    // 坐标模态框
    this.$coordModal = document.getElementById('coordModal');
    this.$coordModalTitle = document.getElementById('modalTitle');
    this.$coordForm = document.getElementById('coordForm');
    this.$coordId = document.getElementById('coordId');
    this.$coordName = document.getElementById('coordName');
    this.$coordWorld = document.getElementById('coordWorld');
    this.$coordX = document.getElementById('coordX');
    this.$coordY = document.getElementById('coordY');
    this.$coordZ = document.getElementById('coordZ');
    this.$coordDimension = document.getElementById('coordDimension');
    this.$coordCategory = document.getElementById('coordCategory');
    this.$coordDesc = document.getElementById('coordDesc');
    this.$coordSubmit = document.getElementById('coordSubmit');
    this.$convertPreview = document.getElementById('convertPreview');
    this.$convertValue = document.getElementById('convertValue');

    // 世界模态框
    this.$worldModal = document.getElementById('worldModal');
    this.$worldForm = document.getElementById('worldForm');
    this.$worldId = document.getElementById('worldId');
    this.$worldName = document.getElementById('worldName');
    this.$deleteWorldBtn = document.getElementById('deleteWorldBtn');

    // 分类模态框
    this.$categoryModal = document.getElementById('categoryModal');
    this.$categoryForm = document.getElementById('categoryForm');
    this.$categoryId = document.getElementById('categoryId');
    this.$categoryName = document.getElementById('categoryName');
    this.$categoryColor = document.getElementById('categoryColor');
    this.$categoryIcon = document.getElementById('categoryIcon');
    this.$deleteCategoryBtn = document.getElementById('deleteCategoryBtn');

    // 导出模态框
    this.$exportModal = document.getElementById('exportModal');
    this.$exportFormat = document.getElementById('exportFormat');
    this.$exportCode = document.getElementById('exportCode');
    this.$downloadBtn = document.getElementById('downloadBtn');
    this.$copyBtn = document.getElementById('copyBtn');

    // 导入模态框
    this.$importModal = document.getElementById('importModal');
    this.$fileDropZone = document.getElementById('fileDropZone');
    this.$fileInput = document.getElementById('fileInput');
    this.$importResult = document.getElementById('importResult');

    // 下界转换模态框
    this.$netherModal = document.getElementById('netherModal');
    this.$convX = document.getElementById('convX');
    this.$convY = document.getElementById('convY');
    this.$convZ = document.getElementById('convZ');
    this.$convOutput = document.getElementById('convOutput');
    this.$convSaveBtn = document.getElementById('convSaveBtn');
    this.$converterTabs = document.querySelectorAll('.converter-tab');
    this._convDirection = 'nether-to-over';

    // 确认对话框
    this.$confirmModal = document.getElementById('confirmModal');
    this.$confirmTitle = document.getElementById('confirmTitle');
    this.$confirmMessage = document.getElementById('confirmMessage');
    this.$confirmBtn = document.getElementById('confirmBtn');

    // 快速操作
    this.$netherConvertBtn = document.getElementById('netherConvertBtn');
    this.$exportBtn = document.getElementById('exportBtn');
    this.$importBtn = document.getElementById('importBtn');
    this.$clearAllBtn = document.getElementById('clearAllBtn');

    // 所有模态框的关闭按钮
    this.$modalCloseBtns = document.querySelectorAll('.modal-close');
  },

  // ---- 全局事件绑定 ----
  _bindEvents() {
    // 侧边栏切换
    this.$hamburger.addEventListener('click', () => this._toggleSidebar(true));
    this.$sidebarToggle.addEventListener('click', () => this._toggleSidebar(false));
    this.$overlay.addEventListener('click', () => this._toggleSidebar(false));

    // 搜索
    this.$searchInput.addEventListener('input', debounce(() => {
      this._state.searchQuery = this.$searchInput.value;
      this._renderLocations();
    }, 250));

    // 筛选
    this.$dimensionFilter.addEventListener('change', () => {
      this._state.currentDimension = this.$dimensionFilter.value;
      this._renderLocations();
    });
    this.$categoryFilter.addEventListener('change', () => {
      this._state.currentCategory = this.$categoryFilter.value;
      this._renderLocations();
    });

    // 排序
    this.$sortFilter.addEventListener('change', () => {
      this._state.currentSort = this.$sortFilter.value;
      this._renderLocations();
    });

    // 视图切换
    this.$viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.$viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._state.currentView = tab.dataset.view;
        this._renderLocations();
      });
    });

    // 添加坐标
    this.$addCoordBtn.addEventListener('click', () => this._openCoordModal());
    this.$emptyAddBtn.addEventListener('click', () => this._openCoordModal());
    this.$fabBtn.addEventListener('click', () => this._openCoordModal());

    // 添加世界/分类
    this.$addWorldBtn.addEventListener('click', () => this._openWorldModal());
    this.$addCategoryBtn.addEventListener('click', () => this._openCategoryModal());

    // 表单提交
    this.$coordForm.addEventListener('submit', (e) => this._handleCoordSubmit(e));
    this.$worldForm.addEventListener('submit', (e) => this._handleWorldSubmit(e));
    this.$categoryForm.addEventListener('submit', (e) => this._handleCategorySubmit(e));

    // 删除世界/分类
    this.$deleteWorldBtn.addEventListener('click', () => this._handleDeleteWorld());
    this.$deleteCategoryBtn.addEventListener('click', () => this._handleDeleteCategory());

    // 下界转换预览
    this.$coordX.addEventListener('input', () => this._updateConvertPreview());
    this.$coordZ.addEventListener('input', () => this._updateConvertPreview());
    this.$coordDimension.addEventListener('change', () => this._updateConvertPreview());

    // 快速操作
    this.$netherConvertBtn.addEventListener('click', () => this._openNetherModal());
    this.$exportBtn.addEventListener('click', () => this._openExportModal());
    this.$importBtn.addEventListener('click', () => this._openImportModal());
    this.$clearAllBtn.addEventListener('click', () => this._handleClearAll());

    // 距离计算器
    this.$distCalcBtn.addEventListener('click', () => this._openDistModal());

    // 距离计算器世界-坐标联动
    this.$distFromWorld.addEventListener('change', () => this._updateDistCoords('from'));
    this.$distToWorld.addEventListener('change', () => this._updateDistCoords('to'));
    this.$distFromCoord.addEventListener('change', () => this._selectDistCoord('from'));
    this.$distToCoord.addEventListener('change', () => this._selectDistCoord('to'));

    // 导出
    this.$exportFormat.addEventListener('change', () => this._updateExportPreview());
    this.$downloadBtn.addEventListener('click', () => this._downloadData());
    this.$copyBtn.addEventListener('click', () => this._copyData());

    // 转换器
    this.$convX.addEventListener('input', () => this._runConverter());
    this.$convY.addEventListener('input', () => this._runConverter());
    this.$convZ.addEventListener('input', () => this._runConverter());
    this.$convSaveBtn.addEventListener('click', () => this._converterSaveAsCoord());

    // 关闭模态框 - 点击背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this._closeModal(modal);
      });
    });
    // 点击关闭按钮
    this.$modalCloseBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this._closeModal(modal);
      });
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => this._closeModal(m));
      }
    });
  },

  // ---- 侧边栏切换 ----
  _toggleSidebar(open) {
    this.$sidebar.classList.toggle('open', open);
    this.$overlay.classList.toggle('active', open);
  },

  // ---- 模态框操作 ----
  _openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  _closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // 关闭侧边栏上的模态框随带关闭侧边栏
    if (window.innerWidth <= 768) {
      // 不关闭侧边栏
    }
  },

  _closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(m => this._closeModal(m));
  },

  // ---- 图标选择器 ----
  _setupIconPicker() {
    document.querySelectorAll('.icon-picker').forEach(picker => {
      picker.querySelectorAll('.icon-option').forEach(opt => {
        opt.addEventListener('click', () => {
          picker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        });
      });
    });
  },

  _getSelectedIcon(pickerId) {
    const sel = document.querySelector(`#${pickerId} .icon-option.selected`);
    return sel ? sel.dataset.icon : '🌍';
  },

  // ---- 颜色选择器 ----
  _setupColorPicker() {
    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
          picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        });
      });
    });
  },

  _getSelectedColor() {
    const sel = document.querySelector('#colorPicker .color-option.selected');
    return sel ? sel.dataset.color : '#3b82f6';
  },

  // ---- 渲染：全部 ----
  _renderAll() {
    this._renderWorldList();
    this._renderCategoryList();
    this._populateWorldSelect();
    this._populateCategorySelect();
    this._populateFilters();
    this._renderLocations();
    this._updateStats();
  },

  // ---- 渲染：世界列表 ----
  _renderWorldList() {
    const worlds = DataStore.getWorlds();
    let html = '<div class="world-item active" data-world-id="all"><span class="world-icon">📋</span><span class="world-name">全部世界</span><span class="world-count">' +
      DataStore.getLocations().length + '</span></div>';

    worlds.forEach(w => {
      const count = DataStore.getLocationCount(w.id);
      const active = this._state.currentWorldId === w.id ? ' active' : '';
      html += `<div class="world-item${active}" data-world-id="${w.id}">
        <span class="world-icon">${w.icon}</span>
        <span class="world-name">${this._escapeHtml(w.name)}</span>
        <span class="world-count">${count}</span>
        <span class="world-actions">
          <button class="btn-icon world-edit" data-id="${w.id}" title="编辑">✏️</button>
        </span>
      </div>`;
    });

    this.$worldList.innerHTML = html;

    // 绑定事件
    this.$worldList.querySelectorAll('.world-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.world-actions')) return;
        const worldId = item.dataset.worldId;
        this._state.currentWorldId = worldId === 'all' ? null : worldId;
        this.$worldList.querySelectorAll('.world-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this._renderAll();
      });
    });

    this.$worldList.querySelectorAll('.world-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openWorldModal(btn.dataset.id);
      });
    });
  },

  // ---- 渲染：分类列表 ----
  _renderCategoryList() {
    const cats = DataStore.getCategories();
    let html = '<div class="category-item active" data-category-id="all"><span class="color-dot" style="background:#888"></span><span class="cat-name">全部分类</span></div>';

    cats.forEach(c => {
      const count = DataStore.getLocationCountByCategory(c.id);
      const active = this._state.currentCategory === c.id ? ' active' : '';
      html += `<div class="category-item${active}" data-category-id="${c.id}">
        <span class="color-dot" style="background:${c.color}"></span>
        <span class="cat-icon">${c.icon || '📌'}</span>
        <span class="cat-name">${this._escapeHtml(c.name)}</span>
        <span class="world-count">${count}</span>
        <span class="category-actions">
          <button class="btn-icon category-edit" data-id="${c.id}" title="编辑">✏️</button>
        </span>
      </div>`;
    });

    this.$categoryList.innerHTML = html;

    this.$categoryList.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.category-actions')) return;
        const catId = item.dataset.categoryId;
        this._state.currentCategory = catId === 'all' ? 'all' : catId;
        this.$categoryFilter.value = this._state.currentCategory;
        this.$categoryList.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this._renderLocations();
      });
    });

    this.$categoryList.querySelectorAll('.category-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openCategoryModal(btn.dataset.id);
      });
    });
  },

  // ---- 填充选择框 ----
  _populateWorldSelect() {
    const worlds = DataStore.getWorlds();
    const sel = this.$coordWorld;
    const currentVal = sel.value;
    sel.innerHTML = worlds.map(w =>
      `<option value="${w.id}">${w.icon} ${this._escapeHtml(w.name)}</option>`
    ).join('');
    if (currentVal) sel.value = currentVal;
  },

  _populateCategorySelect() {
    const cats = DataStore.getCategories();
    const sel = this.$coordCategory;
    sel.innerHTML = '<option value="">未分类</option>' +
      cats.map(c => `<option value="${c.id}">${c.icon || '📌'} ${this._escapeHtml(c.name)}</option>`).join('');
  },

  _populateFilters() {
    // 分类筛选
    const cats = DataStore.getCategories();
    const catSel = this.$categoryFilter;
    const currentCat = catSel.value;
    catSel.innerHTML = '<option value="all">所有分类</option>' +
      cats.map(c => `<option value="${c.id}">${c.icon || '📌'} ${this._escapeHtml(c.name)}</option>`).join('');
    if (currentCat) catSel.value = currentCat;
  },

  // ---- 渲染：坐标列表 ----
  _renderLocations() {
    const filters = {
      worldId: this._state.currentWorldId,
      dimension: this._state.currentDimension,
      category: this._state.currentCategory,
      search: this._state.searchQuery,
      sort: this._state.currentSort,
    };
    const locations = DataStore.getLocations(filters);
    const worlds = DataStore.getWorlds();
    const cats = DataStore.getCategories();

    // 更新标题信息
    const worldName = this._state.currentWorldId
      ? (DataStore.getWorld(this._state.currentWorldId)?.name || '未知')
      : '全部世界';
    this.$currentWorldName.textContent = worldName;
    this.$currentCount.textContent = `${locations.length} 个坐标`;

    if (locations.length === 0) {
      this._showEmptyState();
      return;
    }

    this.$emptyState.style.display = 'none';

    const view = this._state.currentView;

    // 构建数据查找表
    const worldMap = {};
    worlds.forEach(w => worldMap[w.id] = w);
    const catMap = {};
    cats.forEach(c => catMap[c.id] = c);

    let html = '';

    if (view === 'card') {
      html = '<div class="coord-grid">';
      locations.forEach(l => {
        const world = worldMap[l.worldId] || { name: '未知', icon: '❓' };
        const cat = catMap[l.category] || null;
        const dimClass = `dimension-${l.dimension}`;
        const cardCat = l.dimension === 'nether' ? 'category-nether' : l.dimension === 'end' ? 'category-end' : 'category-overworld';
        html += `
          <div class="coord-card ${cardCat}" data-id="${l.id}">
            <div class="coord-card-header">
              <span class="coord-card-name">${this._escapeHtml(l.name)}</span>
              <span class="coord-card-dimension ${dimClass}">${dimensionIcon(l.dimension)} ${dimensionName(l.dimension)}</span>
            </div>
            <div class="coord-card-coords">
              <span>X <span class="coord-value">${l.x}</span></span>
              <span>Y <span class="coord-value-y">${l.y}</span></span>
              <span>Z <span class="coord-value">${l.z}</span></span>
            </div>
            <div class="coord-card-meta">
              <span class="coord-card-world">${world.icon} ${this._escapeHtml(world.name)}</span>
              ${cat ? `<span class="coord-card-category"><span style="color:${cat.color}">●</span> ${cat.icon || ''} ${this._escapeHtml(cat.name)}</span>` : ''}
              <span class="coord-card-time">🕐 ${relativeTime(l.createdAt)}</span>
            </div>
            ${l.description ? `<div class="coord-card-desc">${this._escapeHtml(l.description)}</div>` : ''}
            <div class="coord-card-actions">
              <button class="btn-copy-tp coord-copy-tp" data-id="${l.id}" title="复制传送指令">📋 /tp</button>
              <button class="btn-icon coord-edit" data-id="${l.id}" title="编辑">✏️</button>
              <button class="btn-icon coord-delete danger" data-id="${l.id}" title="删除">🗑️</button>
            </div>
          </div>`;
      });
      html += '</div>';
    } else if (view === 'list') {
      html = '<div class="coord-list">';
      locations.forEach(l => {
        const world = worldMap[l.worldId] || { name: '未知', icon: '❓' };
        const cat = catMap[l.category] || null;
        const dimColor = l.dimension === 'overworld' ? 'var(--dimension-overworld)' : l.dimension === 'nether' ? 'var(--dimension-nether)' : 'var(--dimension-end)';
        html += `
          <div class="coord-list-item" data-id="${l.id}">
            <span class="list-indicator" style="background:${dimColor}"></span>
            <span class="list-name">${this._escapeHtml(l.name)}</span>
            <span class="list-coords">${dimensionIcon(l.dimension)} X:${l.x} Y:${l.y} Z:${l.z}</span>
            ${cat ? `<span class="list-category" style="background:${cat.color}22;color:${cat.color}">${cat.icon || ''} ${this._escapeHtml(cat.name)}</span>` : ''}
            <span class="list-world">${world.icon} ${this._escapeHtml(world.name)}</span>
            <span class="coord-card-actions">
              <button class="btn-copy-tp coord-copy-tp" data-id="${l.id}" title="复制传送指令">📋 /tp</button>
              <button class="btn-icon coord-edit" data-id="${l.id}" title="编辑">✏️</button>
              <button class="btn-icon coord-delete danger" data-id="${l.id}" title="删除">🗑️</button>
            </span>
          </div>`;
      });
      html += '</div>';
    } else if (view === 'map') {
      html = this._renderMapView(locations, worldMap, catMap);
    }

    this.$contentArea.innerHTML = html;

    // 绑定坐标点击事件
    this.$contentArea.querySelectorAll('.coord-card, .coord-list-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.coord-card-actions')) return;
        const id = el.dataset.id;
        this._openCoordModal(id);
      });
    });

    // 编辑按钮
    this.$contentArea.querySelectorAll('.coord-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openCoordModal(btn.dataset.id);
      });
    });

    // 删除按钮
    this.$contentArea.querySelectorAll('.coord-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._confirmDeleteCoord(btn.dataset.id);
      });
    });

    // 复制 TP 按钮
    this.$contentArea.querySelectorAll('.coord-copy-tp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._copyTPCommand(btn.dataset.id, btn);
      });
    });
  },

  // ---- 复制传送指令 ----
  _copyTPCommand(id, btnEl) {
    const loc = DataStore.getLocation(id);
    if (!loc) return;
    const cmd = `/tp ${loc.x} ${loc.y} ${loc.z}`;
    navigator.clipboard.writeText(cmd).then(() => {
      if (btnEl) {
        btnEl.textContent = '✅ 已复制!';
        btnEl.classList.add('copied');
        setTimeout(() => {
          btnEl.textContent = '📋 /tp';
          btnEl.classList.remove('copied');
        }, 1500);
      }
      showToast(`📋 已复制: ${cmd}`, 'success', 2000);
    }).catch(() => {
      showToast('复制失败，请手动复制', 'error');
    });
  },

  // ---- 距离计算器 ----
  _openDistModal() {
    this._state.distFrom = null;
    this._state.distTo = null;
    this.$distFromDisplay.textContent = '未选择';
    this.$distToDisplay.textContent = '未选择';
    this.$distResult.style.display = 'none';

    // 填充世界选择
    const worlds = DataStore.getWorlds();
    const worldOpts = '<option value="">选择世界</option>' +
      worlds.map(w => `<option value="${w.id}">${w.icon} ${this._escapeHtml(w.name)}</option>`).join('');
    this.$distFromWorld.innerHTML = worldOpts;
    this.$distToWorld.innerHTML = worldOpts;
    this._updateDistCoords('from');
    this._updateDistCoords('to');
    this._openModal(this.$distModal);
  },

  _updateDistCoords(side) {
    const worldSel = side === 'from' ? this.$distFromWorld : this.$distToWorld;
    const coordSel = side === 'from' ? this.$distFromCoord : this.$distToCoord;
    const worldId = worldSel.value;
    coordSel.innerHTML = '<option value="">选择坐标</option>';
    if (worldId) {
      const locs = DataStore.getLocations({ worldId, sort: 'name' });
      coordSel.innerHTML += locs.map(l =>
        `<option value="${l.id}">${this._escapeHtml(l.name)} (${l.x},${l.y},${l.z})</option>`
      ).join('');
    }
  },

  _selectDistCoord(side) {
    const coordSel = side === 'from' ? this.$distFromCoord : this.$distToCoord;
    const display = side === 'from' ? this.$distFromDisplay : this.$distToDisplay;
    const id = coordSel.value;
    if (!id) {
      display.textContent = '未选择';
      if (side === 'from') this._state.distFrom = null;
      else this._state.distTo = null;
    } else {
      const loc = DataStore.getLocation(id);
      display.textContent = `${loc.name} — X:${loc.x} Y:${loc.y} Z:${loc.z} (${dimensionName(loc.dimension)})`;
      if (side === 'from') this._state.distFrom = loc;
      else this._state.distTo = loc;
    }
    this._calcDistance();
  },

  _calcDistance() {
    const a = this._state.distFrom;
    const b = this._state.distTo;
    if (!a || !b) {
      this.$distResult.style.display = 'none';
      return;
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    const straight = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const horizontal = Math.sqrt(dx * dx + dz * dz);
    const chunks = horizontal / 16;

    this.$distStraight.textContent = Math.round(straight) + ' 格';
    this.$distHorizontal.textContent = Math.round(horizontal) + ' 格';
    this.$distVertical.textContent = Math.abs(Math.round(dy)) + ' 格';
    this.$distChunks.textContent = chunks.toFixed(1) + ' 个';
    this.$distResult.style.display = 'block';
  },

  // ---- 地图视图 ----
  _renderMapView(locations, worldMap, catMap) {
    if (locations.length === 0) return '<div class="map-view"><div class="empty-state"><p>没有坐标可显示</p></div></div>';

    // 计算坐标范围
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    locations.forEach(l => {
      if (l.x < minX) minX = l.x;
      if (l.x > maxX) maxX = l.x;
      if (l.z < minZ) minZ = l.z;
      if (l.z > maxZ) maxZ = l.z;
    });

    const rangeX = Math.max(maxX - minX, 1);
    const rangeZ = Math.max(maxZ - minZ, 1);
    const padding = 60;
    const mapW = 700;
    const mapH = 500;

    const scaleX = (mapW - padding * 2) / rangeX;
    const scaleZ = (mapH - padding * 2) / rangeZ;
    const scale = Math.min(scaleX, scaleZ, 50);

    const offsetX = (mapW - rangeX * scale) / 2;
    const offsetZ = (mapH - rangeZ * scale) / 2;

    const toScreen = (x, z) => ({
      sx: offsetX + (x - minX) * scale,
      sy: offsetZ + (z - minZ) * scale
    });

    const gridSize = Math.pow(10, Math.floor(Math.log10(Math.max(rangeX, rangeZ) / 3)));
    const gridStep = Math.max(gridSize, 1);

    let svg = `<div class="map-view"><svg viewBox="0 0 ${mapW} ${mapH}" xmlns="http://www.w3.org/2000/svg">`;

    // 背景
    svg += `<rect width="${mapW}" height="${mapH}" fill="#1a1a2e" rx="8"/>`;

    // 网格线
    svg += `<g stroke="#2a2a4a" stroke-width="1" opacity="0.5">`;
    for (let gx = Math.floor(minX / gridStep) * gridStep; gx <= maxX; gx += gridStep) {
      const { sx } = toScreen(gx, 0);
      if (sx >= 0 && sx <= mapW) {
        svg += `<line x1="${sx}" y1="0" x2="${sx}" y2="${mapH}"/>`;
        svg += `<text x="${sx + 3}" y="14" fill="#6a6a8a" font-size="9">${gx}</text>`;
      }
    }
    for (let gz = Math.floor(minZ / gridStep) * gridStep; gz <= maxZ; gz += gridStep) {
      const { sy } = toScreen(0, gz);
      if (sy >= 0 && sy <= mapH) {
        svg += `<line x1="0" y1="${sy}" x2="${mapW}" y2="${sy}"/>`;
        svg += `<text x="3" y="${sy - 3}" fill="#6a6a8a" font-size="9">${gz}</text>`;
      }
    }
    svg += `</g>`;

    // 坐标点
    locations.forEach(l => {
      const { sx, sy } = toScreen(l.x, l.z);
      const dimColor = l.dimension === 'overworld' ? '#22c55e' : l.dimension === 'nether' ? '#ef4444' : '#a855f7';
      svg += `<circle cx="${sx}" cy="${sy}" r="6" fill="${dimColor}" opacity="0.9" stroke="#fff" stroke-width="1.5">
        <title>${this._escapeHtml(l.name)} (${l.x}, ${l.y}, ${l.z})</title>
      </circle>`;
      svg += `<text x="${sx + 9}" y="${sy + 4}" fill="#e8e8f0" font-size="10" font-weight="500">${this._escapeHtml(l.name)}</text>`;
    });

    svg += '</svg></div>';
    return svg;
  },

  // ---- 空状态 ----
  _showEmptyState() {
    this.$emptyState.style.display = 'flex';
    this.$contentArea.innerHTML = '';
    this.$contentArea.appendChild(this.$emptyState);
  },

  // ---- 更新统计 ----
  _updateStats() {
    const stats = DataStore.getStats();
    this.$statTotal.textContent = stats.totalLocations;
    this.$statWorlds.textContent = stats.totalWorlds;
  },

  // ---- 打开坐标模态框（新增/编辑） ----
  _openCoordModal(id = null) {
    this._state.editingCoordId = id;

    if (id) {
      const loc = DataStore.getLocation(id);
      if (!loc) { showToast('坐标不存在', 'error'); return; }
      this.$coordModalTitle.textContent = '编辑坐标';
      this.$coordSubmit.textContent = '更新';
      this.$coordId.value = loc.id;
      this.$coordName.value = loc.name;
      this.$coordWorld.value = loc.worldId;
      this.$coordX.value = loc.x;
      this.$coordY.value = loc.y;
      this.$coordZ.value = loc.z;
      this.$coordDimension.value = loc.dimension;
      this.$coordCategory.value = loc.category || '';
      this.$coordDesc.value = loc.description || '';
    } else {
      this.$coordModalTitle.textContent = '添加坐标';
      this.$coordSubmit.textContent = '保存';
      this.$coordForm.reset();
      this.$coordId.value = '';
      // 默认使用第一个世界
      const worlds = DataStore.getWorlds();
      if (worlds.length > 0) this.$coordWorld.value = worlds[0].id;
      this.$coordY.value = 64;
    }

    this._updateConvertPreview();
    this._populateWorldSelect();
    this._populateCategorySelect();
    this._openModal(this.$coordModal);
    setTimeout(() => this.$coordName.focus(), 100);
  },

  // ---- 提交坐标表单 ----
  _handleCoordSubmit(e) {
    e.preventDefault();
    const id = this.$coordId.value;
    const data = {
      name: this.$coordName.value,
      worldId: this.$coordWorld.value,
      x: this.$coordX.value,
      y: this.$coordY.value,
      z: this.$coordZ.value,
      dimension: this.$coordDimension.value,
      category: this.$coordCategory.value,
      description: this.$coordDesc.value,
    };

    if (!data.name.trim()) { showToast('请输入坐标名称', 'error'); return; }
    if (data.x === '' || data.z === '') { showToast('请输入 X 和 Z 坐标', 'error'); return; }

    if (id) {
      DataStore.updateLocation(id, data);
      showToast('✅ 坐标已更新', 'success');
    } else {
      DataStore.addLocation(data);
      showToast('✅ 坐标已添加', 'success');
    }

    this._closeModal(this.$coordModal);
    this._renderAll();
  },

  // ---- 下界转换预览 ----
  _updateConvertPreview() {
    const dim = this.$coordDimension.value;
    const x = parseFloat(this.$coordX.value);
    const z = parseFloat(this.$coordZ.value);

    if (dim === 'nether' && !isNaN(x) && !isNaN(z)) {
      const result = netherToOverworld(x, z);
      this.$convertPreview.style.display = 'flex';
      this.$convertValue.textContent = `X: ${result.x}, Z: ${result.z}`;
    } else if (dim === 'overworld' && !isNaN(x) && !isNaN(z)) {
      const result = overworldToNether(x, z);
      this.$convertPreview.style.display = 'flex';
      this.$convertValue.textContent = `X: ${result.x}, Z: ${result.z}`;
    } else {
      this.$convertPreview.style.display = 'none';
    }
  },

  // ---- 确认删除坐标 ----
  _confirmDeleteCoord(id) {
    const loc = DataStore.getLocation(id);
    if (!loc) return;
    this._showConfirm(
      '删除坐标',
      `确定要删除「${loc.name}」吗？此操作不可撤销。`,
      () => {
        DataStore.deleteLocation(id);
        showToast('🗑️ 坐标已删除', 'info');
        this._renderAll();
      }
    );
  },

  // ---- 确认对话框 ----
  _showConfirm(title, message, onConfirm) {
    this.$confirmTitle.textContent = title;
    this.$confirmMessage.textContent = message;
    this._openModal(this.$confirmModal);
    const handler = () => {
      onConfirm();
      this._closeModal(this.$confirmModal);
      this.$confirmBtn.removeEventListener('click', handler);
    };
    this.$confirmBtn.addEventListener('click', handler);
  },

  // ---- 世界模态框 ----
  _openWorldModal(id = null) {
    this._state.editingWorldId = id;
    if (id) {
      const world = DataStore.getWorld(id);
      if (!world) { showToast('世界不存在', 'error'); return; }
      this.$worldModalTitle.textContent = '编辑世界';
      this.$worldId.value = world.id;
      this.$worldName.value = world.name;
      this.$deleteWorldBtn.style.display = 'block';
      // 设置图标选择
      const picker = this.$worldForm.querySelector('.icon-picker');
      picker.querySelectorAll('.icon-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.icon === world.icon);
      });
    } else {
      this.$worldModalTitle.textContent = '添加世界';
      this.$worldForm.reset();
      this.$worldId.value = '';
      this.$deleteWorldBtn.style.display = 'none';
      this.$worldForm.querySelector('.icon-picker .icon-option:first-child').classList.add('selected');
    }
    this._openModal(this.$worldModal);
    setTimeout(() => this.$worldName.focus(), 100);
  },

  _handleWorldSubmit(e) {
    e.preventDefault();
    const id = this.$worldId.value;
    const name = this.$worldName.value.trim();
    const icon = this._getSelectedIcon('iconPicker');

    if (!name) { showToast('请输入世界名称', 'error'); return; }

    if (id) {
      DataStore.updateWorld(id, { name, icon });
      showToast('✅ 世界已更新', 'success');
    } else {
      DataStore.addWorld(name, icon);
      showToast('✅ 世界已添加', 'success');
    }

    this._closeModal(this.$worldModal);
    this._renderAll();
  },

  _handleDeleteWorld() {
    const id = this.$worldId.value;
    const world = DataStore.getWorld(id);
    if (!world) return;
    const count = DataStore.getLocationCount(id);
    this._showConfirm(
      '删除世界',
      `确定要删除「${world.name}」吗？${count > 0 ? `其中的 ${count} 个坐标也将被删除。` : ''}此操作不可撤销！`,
      () => {
        DataStore.deleteWorld(id);
        if (this._state.currentWorldId === id) this._state.currentWorldId = null;
        this._closeModal(this.$worldModal);
        showToast('🗑️ 世界已删除', 'info');
        this._renderAll();
      }
    );
  },

  // ---- 分类模态框 ----
  _openCategoryModal(id = null) {
    this._state.editingCategoryId = id;
    if (id) {
      const cat = DataStore.getCategory(id);
      if (!cat) { showToast('分类不存在', 'error'); return; }
      this.$categoryModalTitle.textContent = '编辑分类';
      this.$categoryId.value = cat.id;
      this.$categoryName.value = cat.name;
      this.$categoryIcon.value = cat.icon || '📌';
      this.$deleteCategoryBtn.style.display = 'block';
      // 设置颜色
      const picker = this.$categoryForm.querySelector('.color-picker');
      picker.querySelectorAll('.color-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.color === cat.color);
      });
    } else {
      this.$categoryModalTitle.textContent = '添加分类';
      this.$categoryForm.reset();
      this.$categoryId.value = '';
      this.$categoryIcon.value = '🏷️';
      this.$deleteCategoryBtn.style.display = 'none';
      this.$categoryForm.querySelector('.color-picker .color-option:first-child').classList.add('selected');
    }
    this._populateCategorySelect();
    this._openModal(this.$categoryModal);
    setTimeout(() => this.$categoryName.focus(), 100);
  },

  _handleCategorySubmit(e) {
    e.preventDefault();
    const id = this.$categoryId.value;
    const name = this.$categoryName.value.trim();
    const color = this._getSelectedColor();
    const icon = this.$categoryIcon.value.trim() || '🏷️';

    if (!name) { showToast('请输入分类名称', 'error'); return; }

    if (id) {
      DataStore.updateCategory(id, { name, color, icon });
      showToast('✅ 分类已更新', 'success');
    } else {
      DataStore.addCategory(name, color, icon);
      showToast('✅ 分类已添加', 'success');
    }

    this._closeModal(this.$categoryModal);
    this._renderAll();
  },

  _handleDeleteCategory() {
    const id = this.$categoryId.value;
    const cat = DataStore.getCategory(id);
    if (!cat) return;
    const count = DataStore.getLocationCountByCategory(id);
    this._showConfirm(
      '删除分类',
      `确定要删除分类「${cat.name}」吗？${count > 0 ? `其中的 ${count} 个坐标将变为'未分类'。` : ''}`,
      () => {
        DataStore.deleteCategory(id);
        if (this._state.currentCategory === id) this._state.currentCategory = 'all';
        this._closeModal(this.$categoryModal);
        showToast('🗑️ 分类已删除', 'info');
        this._renderAll();
      }
    );
  },

  // ---- 导出 ----
  _openExportModal() {
    this._updateExportPreview();
    this._openModal(this.$exportModal);
  },

  _updateExportPreview() {
    const format = this.$exportFormat.value;
    const data = format === 'json' ? DataStore.exportJSON() : DataStore.exportCSV();
    this.$exportCode.textContent = data.length > 2000 ? data.substring(0, 2000) + '\n... (已截断)' : data;
  },

  _downloadData() {
    const format = this.$exportFormat.value;
    const data = format === 'json' ? DataStore.exportJSON() : DataStore.exportCSV();
    const ext = format === 'json' ? 'json' : 'csv';
    const mime = format === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mc-coords-${new Date().toISOString().slice(0,10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('⬇️ 文件已下载', 'success');
  },

  _copyData() {
    const format = this.$exportFormat.value;
    const data = format === 'json' ? DataStore.exportJSON() : DataStore.exportCSV();
    navigator.clipboard.writeText(data).then(() => {
      showToast('📋 已复制到剪贴板', 'success');
    }).catch(() => {
      showToast('复制失败，请手动选择复制', 'error');
    });
  },

  // ---- 导入 ----
  _openImportModal() {
    this.$importResult.style.display = 'none';
    this._openModal(this.$importModal);
  },

  _setupFileImport() {
    // 点击上传
    this.$fileDropZone.addEventListener('click', () => this.$fileInput.click());
    this.$fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._readImportFile(e.target.files[0]);
      }
    });

    // 拖拽
    this.$fileDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.$fileDropZone.classList.add('dragover');
    });
    this.$fileDropZone.addEventListener('dragleave', () => {
      this.$fileDropZone.classList.remove('dragover');
    });
    this.$fileDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.$fileDropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this._readImportFile(e.dataTransfer.files[0]);
      }
    });
  },

  _readImportFile(file) {
    if (!file.name.endsWith('.json')) {
      this.$importResult.textContent = '❌ 请选择 JSON 文件';
      this.$importResult.className = 'import-result error';
      this.$importResult.style.display = 'block';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const mode = document.querySelector('input[name="importMode"]:checked').value;
      const result = DataStore.importJSON(e.target.result, mode);
      this.$importResult.style.display = 'block';
      if (result.success) {
        this.$importResult.textContent = `✅ 导入成功！当前共 ${result.count} 个坐标`;
        this.$importResult.className = 'import-result success';
        this._renderAll();
      } else {
        this.$importResult.textContent = `❌ ${result.error}`;
        this.$importResult.className = 'import-result error';
      }
    };
    reader.readAsText(file);
  },

  // ---- 下界转换器 ----
  _openNetherModal() {
    this._convDirection = 'nether-to-over';
    this.$converterTabs.forEach(t => {
      t.classList.remove('active');
      if (t.dataset.dir === 'nether-to-over') t.classList.add('active');
    });
    this.$convX.value = 0;
    this.$convY.value = 64;
    this.$convZ.value = 0;
    this._runConverter();
    this._openModal(this.$netherModal);
  },

  _setupConverter() {
    this.$converterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.$converterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._convDirection = tab.dataset.dir;
        this._runConverter();
      });
    });
  },

  _runConverter() {
    const x = parseFloat(this.$convX.value) || 0;
    const y = parseFloat(this.$convY.value) || 64;
    const z = parseFloat(this.$convZ.value) || 0;

    let result;
    let label;
    if (this._convDirection === 'nether-to-over') {
      result = netherToOverworld(x, z);
      label = `🌳 主世界: X: ${result.x}, Y: ${Math.round(y * 2)}, Z: ${result.z}`;
    } else {
      result = overworldToNether(x, z);
      label = `🔥 下界: X: ${result.x}, Y: ${Math.round(y / 2)}, Z: ${result.z}`;
    }
    this.$convOutput.textContent = label;
  },

  _converterSaveAsCoord() {
    const x = parseFloat(this.$convX.value) || 0;
    const y = parseFloat(this.$convY.value) || 64;
    const z = parseFloat(this.$convZ.value) || 0;

    let resultX, resultY, resultZ, dim;
    if (this._convDirection === 'nether-to-over') {
      const r = netherToOverworld(x, z);
      resultX = r.x;
      resultY = Math.round(y * 2);
      resultZ = r.z;
      dim = 'overworld';
    } else {
      const r = overworldToNether(x, z);
      resultX = r.x;
      resultY = Math.round(y / 2);
      resultZ = r.z;
      dim = 'nether';
    }

    // 复制到剪贴板
    const coordsText = `X: ${resultX}, Y: ${resultY}, Z: ${resultZ} (${dimensionName(dim)})`;
    navigator.clipboard.writeText(coordsText).then(() => {
      showToast(`📋 已复制: ${coordsText}`, 'success');
    }).catch(() => {
      showToast('复制失败', 'error');
    });

    // 打开添加坐标表单并填充转换后的坐标
    this._closeModal(this.$netherModal);
    this.$coordForm.reset();
    this.$coordId.value = '';
    this.$coordX.value = resultX;
    this.$coordY.value = resultY;
    this.$coordZ.value = resultZ;
    this.$coordDimension.value = dim;
    this._populateWorldSelect();
    this._populateCategorySelect();
    const worlds = DataStore.getWorlds();
    if (worlds.length > 0) this.$coordWorld.value = worlds[0].id;
    this.$coordModalTitle.textContent = '添加坐标（转换结果）';
    this.$coordSubmit.textContent = '保存';
    this._updateConvertPreview();
    this._openModal(this.$coordModal);
    setTimeout(() => this.$coordName.focus(), 100);
  },

  // ---- 清空数据 ----
  _handleClearAll() {
    this._showConfirm(
      '⚠️ 清空所有数据',
      '确定要清空所有坐标、世界和分类数据吗？此操作不可撤销！建议先导出备份。',
      () => {
        DataStore.clearAll();
        this._state.currentWorldId = null;
        this._state.currentCategory = 'all';
        this._state.currentDimension = 'all';
        this._state.searchQuery = '';
        this.$searchInput.value = '';
        this.$dimensionFilter.value = 'all';
        this.$categoryFilter.value = 'all';
        showToast('🗑️ 所有数据已清空', 'info');
        this._renderAll();
      }
    );
  },

  // ---- HTML 转义 ----
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// ---- 启动应用 ----
document.addEventListener('DOMContentLoaded', () => App.init());
