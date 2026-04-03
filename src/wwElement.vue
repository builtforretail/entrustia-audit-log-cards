<template>
  <div class="alc-wrapper">

    <!-- Filter Bar -->
    <div class="alc-filter-bar">
      <div class="alc-search-wrap">
        <span class="alc-search-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#9ca3af" stroke-width="1.5"/>
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>
        <input
          class="alc-search-input"
          type="text"
          placeholder="Search..."
          :value="searchText"
          @input="onSearchInput($event.target.value)"
        />
        <button v-if="searchText" class="alc-clear-btn" @click="onSearchInput('')">&#x2715;</button>
      </div>

      <div class="alc-select-wrap">
        <select class="alc-select" :value="actionFilter" @change="onActionChange($event.target.value)">
          <option value="">All Actions</option>
          <option v-for="action in uniqueActions" :key="action" :value="action">{{ action }}</option>
        </select>
        <button v-if="actionFilter" class="alc-clear-btn alc-clear-select" @click="onActionChange('')">&#x2715;</button>
      </div>

      <button class="alc-reset-link" @click="resetFilters">Reset</button>
    </div>

    <!-- Cards -->
    <div
      v-for="item in pagedItems"
      :key="item.id"
      class="alc-card"
      @click="handleRowClick(item)"
    >
      <div class="alc-row">
        <span class="alc-label">Date</span>
        <span class="alc-value">{{ item.formattedDate }}</span>
      </div>
      <div class="alc-row">
        <span class="alc-label">User</span>
        <span class="alc-value">{{ item.user_id }}</span>
      </div>
      <div class="alc-row">
        <span class="alc-label">Action</span>
        <span class="alc-value">{{ item.action }}</span>
      </div>
      <div class="alc-row">
        <span class="alc-label">Target</span>
        <span class="alc-value">{{ item.target_type }}</span>
      </div>
    </div>

    <div v-if="pagedItems.length === 0" class="alc-empty">
      No results found.
    </div>

    <!-- Pagination Bar -->
    <div v-if="totalPages > 1" class="alc-pagination">
      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === 1 }"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        title="First page"
      >&#10094;&#10094;</button>

      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === 1 }"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        title="Previous page"
      >&#10094;</button>

      <span class="alc-page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        title="Next page"
      >&#10095;</button>

      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
        title="Last page"
      >&#10095;&#10095;</button>
    </div>

    <!-- Record count -->
    <div class="alc-count">
      {{ filteredItems.length === allItems.length
        ? allItems.length + ' records'
        : filteredItems.length + ' of ' + allItems.length + ' records' }}
    </div>

  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {

    /* wwEditor:start */
    const isEditing = computed(() => props.wwEditorState && props.wwEditorState.isEditing);
    /* wwEditor:end */

    // Internal variables
    const { value: selectedItem, setValue: setSelectedItem } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedItem',
      type: 'object',
      defaultValue: {},
    });

    const { value: itemCount, setValue: setItemCount } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'itemCount',
      type: 'number',
      defaultValue: 0,
    });

    const { value: filteredCount, setValue: setFilteredCount } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'filteredCount',
      type: 'number',
      defaultValue: 0,
    });

    const { value: currentPageVar, setValue: setCurrentPageVar } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentPage',
      type: 'number',
      defaultValue: 1,
    });

    const { value: totalPagesVar, setValue: setTotalPagesVar } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'totalPages',
      type: 'number',
      defaultValue: 1,
    });

    // Hover / active state refs (required pattern)
    const hoverState = ref({});
    const activeState = ref({});

    const setHover = (id, val) => { hoverState.value = Object.assign({}, hoverState.value, { [id]: val }); };
    const setActive = (id, val) => { activeState.value = Object.assign({}, activeState.value, { [id]: val }); };

    const getOpenButtonStyle = (id) => {
      const isHovered = hoverState.value[id + '_open'] || false;
      const isActive = activeState.value[id + '_open'] || false;
      return {
        backgroundColor: isActive ? '#1a4731' : (isHovered ? '#245a3f' : '#2d6a4f'),
        color: '#fff',
        border: 'none',
      };
    };

    const getEditButtonStyle = (id) => {
      const isHovered = hoverState.value[id + '_edit'] || false;
      const isActive = activeState.value[id + '_edit'] || false;
      return {
        backgroundColor: isActive ? '#e8f5ef' : (isHovered ? '#f0faf4' : 'transparent'),
        color: '#2d6a4f',
        border: '1.5px solid #2d6a4f',
      };
    };

    // Filter + pagination state
    const searchText = ref('');
    const actionFilter = ref('');
    const currentPage = ref(1);

    // Reset page to 1 when filters change
    const onSearchInput = (val) => {
      searchText.value = val;
      currentPage.value = 1;
    };

    const onActionChange = (val) => {
      actionFilter.value = val;
      currentPage.value = 1;
    };

    const resetFilters = () => {
      searchText.value = '';
      actionFilter.value = '';
      currentPage.value = 1;
    };

    // Format date helper
    const formatDate = (ts) => {
      if (!ts) return '';
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts + '';
      const yyyy = d.getFullYear();
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const dd = ('0' + d.getDate()).slice(-2);
      const hh = ('0' + d.getHours()).slice(-2);
      const min = ('0' + d.getMinutes()).slice(-2);
      return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min;
    };

    // All items resolved
    const allItems = computed(() => {
      const items = props.content && props.content.data ? props.content.data : [];
      if (!Array.isArray(items)) return [];

      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

      return items.map((item) => {
        const id = resolveMappingFormula(props.content && props.content.dataIdFormula, item) || item.id || '';
        const action = resolveMappingFormula(props.content && props.content.dataNameFormula, item) || item.action || '';

        return {
          id: id,
          created_at: item.created_at || '',
          formattedDate: formatDate(item.created_at || ''),
          tenant_id: item.tenant_id || '',
          user_id: item.user_id || '',
          action: action,
          target_type: item.target_type || '',
          target_id: item.target_id || '',
          meta: item.meta || null,
          _raw: item,
        };
      });
    });

    // Unique action values for dropdown
    const uniqueActions = computed(() => {
      const seen = {};
      const result = [];
      const items = allItems.value;
      for (let i = 0; i < items.length; i++) {
        const a = items[i].action || '';
        if (a && !seen[a]) {
          seen[a] = true;
          result.push(a);
        }
      }
      result.sort();
      return result;
    });

    // Filtered (all pages)
    const filteredItems = computed(() => {
      const items = allItems.value;
      const search = (searchText.value || '').toLowerCase();
      const actionVal = actionFilter.value || '';

      return items.filter((item) => {
        const matchSearch = !search ||
          (item.formattedDate || '').toLowerCase().indexOf(search) !== -1 ||
          (item.user_id + '').toLowerCase().indexOf(search) !== -1 ||
          (item.action || '').toLowerCase().indexOf(search) !== -1 ||
          (item.target_type || '').toLowerCase().indexOf(search) !== -1;

        const matchAction = !actionVal || item.action === actionVal;

        return matchSearch && matchAction;
      });
    });

    // Pagination derived values
    const resolvedPageSize = computed(() => {
      const ps = props.content && props.content.pageSize ? parseInt(props.content.pageSize, 10) : 25;
      return ps > 0 ? ps : 25;
    });

    const totalPages = computed(() => {
      const total = filteredItems.value.length;
      if (total === 0) return 1;
      return Math.ceil(total / resolvedPageSize.value);
    });

    // Current page clamped to valid range
    const safePage = computed(() => {
      const tp = totalPages.value;
      const cp = currentPage.value;
      if (cp < 1) return 1;
      if (cp > tp) return tp;
      return cp;
    });

    // Slice for current page
    const pagedItems = computed(() => {
      const start = (safePage.value - 1) * resolvedPageSize.value;
      const end = start + resolvedPageSize.value;
      return filteredItems.value.slice(start, end);
    });

    const goToPage = (page) => {
      const tp = totalPages.value;
      const clamped = page < 1 ? 1 : (page > tp ? tp : page);
      currentPage.value = clamped;

      const offset = (clamped - 1) * resolvedPageSize.value;
      emit('trigger-event', {
        name: 'page-change',
        event: {
          page: clamped,
          pageSize: resolvedPageSize.value,
          offset: offset,
        },
      });
    };

    // Sync internal variables
    watch(allItems, (val) => {
      setItemCount(val.length);
    }, { immediate: true });

    watch(filteredItems, (val) => {
      setFilteredCount(val.length);
    }, { immediate: true });

    watch(safePage, (val) => {
      setCurrentPageVar(val);
    }, { immediate: true });

    watch(totalPages, (val) => {
      setTotalPagesVar(val);
      // If current page is now out of range, clamp it
      if (currentPage.value > val) {
        currentPage.value = val > 0 ? val : 1;
      }
    }, { immediate: true });

    const handleRowClick = (item) => {
      setSelectedItem(item._raw || item);
      emit('trigger-event', {
        name: 'row-click',
        event: { row: item._raw || item },
      });
    };

    return {
      props,
      searchText,
      actionFilter,
      uniqueActions,
      allItems,
      filteredItems,
      pagedItems,
      currentPage: safePage,
      totalPages,
      resetFilters,
      onSearchInput,
      onActionChange,
      goToPage,
      handleRowClick,
      setHover,
      setActive,
      getOpenButtonStyle,
      getEditButtonStyle,
      /* wwEditor:start */
      isEditing,
      /* wwEditor:end */
    };
  },
};
</script>

<style scoped>
.alc-wrapper {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

/* Filter Bar */
.alc-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: nowrap;
}

.alc-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 0;
  min-width: 0;
}

.alc-search-icon {
  position: absolute;
  left: 8px;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.alc-search-input {
  width: 100%;
  padding: 7px 28px 7px 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  box-sizing: border-box;
  color: #374151;
}

.alc-search-input:focus {
  border-color: #2d6a4f;
}

.alc-clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 12px;
  padding: 0 2px;
  line-height: 1;
}

.alc-clear-btn:hover {
  color: #374151;
}

.alc-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.alc-select {
  padding: 7px 28px 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: #374151;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  max-width: 130px;
}

.alc-select:focus {
  border-color: #2d6a4f;
}

.alc-clear-select {
  right: 6px;
}

.alc-reset-link {
  background: none;
  border: none;
  color: #374151;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.alc-reset-link:hover {
  color: #2d6a4f;
}

/* Cards */
.alc-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
  box-sizing: border-box;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.alc-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.alc-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 5px 0;
  border-bottom: 1px solid #f3f4f6;
  gap: 8px;
}

.alc-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.alc-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 64px;
}

.alc-value {
  font-size: 13px;
  color: #111827;
  text-align: right;
  word-break: break-word;
}

.alc-empty {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
}

/* Pagination */
.alc-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
  margin-bottom: 8px;
}

.alc-page-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  padding: 5px 9px;
  font-size: 12px;
  cursor: pointer;
  color: #374151;
  line-height: 1;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.alc-page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.alc-page-btn--disabled,
.alc-page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.alc-page-info {
  font-size: 12px;
  color: #6b7280;
  padding: 0 4px;
  white-space: nowrap;
}

/* Record count */
.alc-count {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  padding-bottom: 4px;
}
</style>
