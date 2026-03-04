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
          @input="searchText = $event.target.value"
        />
        <button v-if="searchText" class="alc-clear-btn" @click="searchText = ''">&#x2715;</button>
      </div>

      <div class="alc-select-wrap">
        <select class="alc-select" :value="actionFilter" @change="actionFilter = $event.target.value">
          <option value="">All Actions</option>
          <option v-for="action in uniqueActions" :key="action" :value="action">{{ action }}</option>
        </select>
        <button v-if="actionFilter" class="alc-clear-btn alc-clear-select" @click="actionFilter = ''">&#x2715;</button>
      </div>

      <button class="alc-reset-link" @click="resetFilters">Reset</button>
    </div>

    <!-- Cards -->
    <div
      v-for="item in processedItems"
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

    <div v-if="processedItems.length === 0" class="alc-empty">
      No results found.
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

    // Filter state
    const searchText = ref('');
    const actionFilter = ref('');

    const resetFilters = () => {
      searchText.value = '';
      actionFilter.value = '';
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

    // All items (resolved)
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

    // Filtered items
    const processedItems = computed(() => {
      const items = allItems.value;
      const search = (searchText.value || '').toLowerCase();
      const actionVal = actionFilter.value || '';

      const filtered = items.filter((item) => {
        const matchSearch = !search ||
          (item.formattedDate || '').toLowerCase().indexOf(search) !== -1 ||
          (item.user_id + '').toLowerCase().indexOf(search) !== -1 ||
          (item.action || '').toLowerCase().indexOf(search) !== -1 ||
          (item.target_type || '').toLowerCase().indexOf(search) !== -1;

        const matchAction = !actionVal || item.action === actionVal;

        return matchSearch && matchAction;
      });

      return filtered;
    });

    // Sync internal variables
    watch(allItems, (val) => {
      setItemCount(val.length);
    }, { immediate: true });

    watch(processedItems, (val) => {
      setFilteredCount(val.length);
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
      processedItems,
      resetFilters,
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
  padding: 0 0 0 0;
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
</style>
