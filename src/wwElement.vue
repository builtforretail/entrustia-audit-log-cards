<template>
  <div class="alc-wrapper">

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
          <option v-for="action in uniqueActions" :key="action.raw" :value="action.raw">{{ action.label }}</option>
        </select>
        <button v-if="actionFilter" class="alc-clear-btn alc-clear-select" @click="onActionChange('')">&#x2715;</button>
      </div>

      <button class="alc-reset-link" @click="resetFilters">Reset</button>
    </div>

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
        <span class="alc-value">{{ item.userDisplay }}</span>
      </div>
      <div class="alc-row">
        <span class="alc-label">Action</span>
        <span class="alc-value">{{ item.actionLabel }}</span>
      </div>
      <div class="alc-row">
        <span class="alc-label">Target</span>
        <span class="alc-value">{{ item.targetDisplay }}</span>
      </div>
    </div>

    <div v-if="pagedItems.length === 0" class="alc-empty">
      No results found.
    </div>

    <div v-if="totalPages > 1" class="alc-pagination">
      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === 1 }"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
      >&#10094;&#10094;</button>
      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === 1 }"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >&#10094;</button>
      <span class="alc-page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >&#10095;</button>
      <button
        class="alc-page-btn"
        :class="{ 'alc-page-btn--disabled': currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
      >&#10095;&#10095;</button>
    </div>

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

    const hoverState = ref({});
    const activeState = ref({});
    const setHover = (id, val) => { hoverState.value = Object.assign({}, hoverState.value, { [id]: val }); };
    const setActive = (id, val) => { activeState.value = Object.assign({}, activeState.value, { [id]: val }); };
    const getOpenButtonStyle = (id) => {
      const isHovered = hoverState.value[id + '_open'] || false;
      const isActive = activeState.value[id + '_open'] || false;
      return { backgroundColor: isActive ? '#1a4731' : (isHovered ? '#245a3f' : '#2d6a4f'), color: '#fff', border: 'none' };
    };
    const getEditButtonStyle = (id) => {
      const isHovered = hoverState.value[id + '_edit'] || false;
      const isActive = activeState.value[id + '_edit'] || false;
      return { backgroundColor: isActive ? '#e8f5ef' : (isHovered ? '#f0faf4' : 'transparent'), color: '#2d6a4f', border: '1.5px solid #2d6a4f' };
    };

    const searchText = ref('');
    const actionFilter = ref('');
    const currentPage = ref(1);

    const onSearchInput = (val) => { searchText.value = val; currentPage.value = 1; };
    const onActionChange = (val) => { actionFilter.value = val; currentPage.value = 1; };
    const resetFilters = () => { searchText.value = ''; actionFilter.value = ''; currentPage.value = 1; };

    const getActionLabel = (raw) => {
      if (!raw) return '';
      if (raw === 'internal_upload') return 'File uploaded';
      if (raw === 'files.create') return 'File uploaded';
      if (raw === 'files.update') return 'File updated';
      if (raw === 'files.delete') return 'File deleted';
      if (raw === 'files.delete_everywhere') return 'File deleted';
      if (raw === 'scans.consume') return 'File scanned';
      if (raw === 'ai_enrich.text') return 'AI enrichment run';
      if (raw === 'ai_enrich.persist') return 'AI enrichment saved';
      if (raw === 'folders.create') return 'Folder created';
      if (raw === 'folders.update') return 'Folder updated';
      if (raw === 'folders.delete') return 'Folder deleted';
      if (raw === 'folders.delete_everywhere') return 'Folder deleted';
      if (raw === 'upload_portals.create') return 'Upload portal created';
      if (raw === 'upload_portals.update') return 'Upload portal updated';
      if (raw === 'upload_portals.delete') return 'Upload portal deleted';
      if (raw === 'upload_portals.link') return 'Upload portal link copied';
      if (raw === 'upload_portals.toggle') return 'Upload portal toggled';
      if (raw === 'upload_portals.share') return 'Upload portal shared';
      if (raw === 'public_upload') return 'File received';
      if (raw === 'public_upload_notification_sent') return 'Upload notification sent';
      if (raw === 'public_portals.unlock') return 'Portal PIN unlock';
      if (raw === 'invites.create') return 'Team member invited';
      if (raw === 'invites.delete') return 'Invite removed';
      if (raw === 'invites.resend') return 'Invite resent';
      if (raw === 'invites.accept') return 'Invite accepted';
      if (raw === 'tenant.members.update_status') return 'Member status updated';
      if (raw === 'tenant.account_update') return 'Account name updated';
      if (raw === 'tenant.account_logo_upload') return 'Account logo updated';
      if (raw === 'tenant.branding.update') return 'Branding updated';
      if (raw === 'tenant.branding_logo_upload') return 'Public portal logo updated';
      if (raw === 'tenant.branding.logo_upload') return 'Branding logo updated';
      if (raw === 'tenant.transfer_ownership') return 'Ownership transferred';
      if (raw === 'tenant.delete_request') return 'Account deletion requested';
      if (raw === 'auth.profile_update') return 'Profile updated';
      return raw;
    };

    const getUserDisplay = (userId, members) => {
      if (!Array.isArray(members) || members.length === 0) return userId != null ? userId + '' : '';
      if (userId === null || userId === undefined) return '';
      let match = null;
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (m && (m.user_id === userId || m.user_id === parseInt(userId, 10))) { match = m; break; }
      }
      if (!match) return userId + '';
      if (match.first_name != null && match.first_name !== '') {
        return (match.first_name || '') + ' ' + (match.last_name || '') + ' (' + (match.email || '') + ')';
      }
      return match.email || (userId + '');
    };

    const getTargetDisplay = (meta) => {
      if (meta === null || meta === undefined) return '';
      if (typeof meta !== 'object' || Array.isArray(meta)) return '';
      if (typeof meta.from === 'string' && typeof meta.to === 'string') return meta.from + ' > ' + meta.to;
      if (Array.isArray(meta.to)) return meta.to.join(', ');
      if (Array.isArray(meta.recipients)) return meta.recipients.join(', ');
      if (Array.isArray(meta.updated_fields)) return meta.updated_fields.join(', ');
      if (Array.isArray(meta.changed)) return meta.changed.filter((v) => v !== null && v !== undefined).join(' > ');
      if (meta.updated && typeof meta.updated === 'object' && !Array.isArray(meta.updated) && meta.updated.name) return meta.updated.name + '';
      if (typeof meta.company_logo_url === 'string') return meta.company_logo_url.split('/').pop().split('..')[0];
      if (typeof meta.is_enabled === 'boolean') return meta.is_enabled ? 'Enabled' : 'Disabled';
      const pKeys = ['brand_name', 'name', 'filename', 'uploader_name', 'email', 'uploader_email', 'portal_slug', 'slug', 'canonical_url'];
      for (let i = 0; i < pKeys.length; i++) {
        const v = meta[pKeys[i]];
        if (v !== null && v !== undefined) {
          if (typeof v === 'string' && (v.indexOf('http://') === 0 || v.indexOf('https://') === 0)) return '';
          return v + '';
        }
      }
      const allKeys = Object.keys(meta);
      if (allKeys.length > 0) {
        const first = meta[allKeys[0]];
        if (typeof first === 'string' && first.indexOf('http://') !== 0 && first.indexOf('https://') !== 0) return first;
      }
      return '';
    };

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

    const allItems = computed(() => {
      const items = props.content && props.content.data ? props.content.data : [];
      if (!Array.isArray(items)) return [];
      const members = props.content && Array.isArray(props.content.members) ? props.content.members : [];
      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();
      return items.map((item) => {
        if (!item) return null;
        const id = resolveMappingFormula(props.content && props.content.dataIdFormula, item) || item.id || '';
        const rawAction = resolveMappingFormula(props.content && props.content.dataNameFormula, item) || item.action || '';
        return {
          id: id,
          created_at: item.created_at || '',
          formattedDate: formatDate(item.created_at || ''),
          tenant_id: item.tenant_id || '',
          user_id: item.user_id != null ? item.user_id : '',
          userDisplay: getUserDisplay(item.user_id, members),
          action: rawAction,
          actionLabel: getActionLabel(rawAction),
          target_type: item.target_type || '',
          targetDisplay: getTargetDisplay(item.meta != null ? item.meta : null),
          meta: item.meta != null ? item.meta : null,
          _raw: item,
        };
      }).filter((item) => item !== null);
    });

    const uniqueActions = computed(() => {
      const seen = {};
      const result = [];
      const items = allItems.value;
      for (let i = 0; i < items.length; i++) {
        const raw = items[i].action || '';
        if (raw && !seen[raw]) {
          seen[raw] = true;
          result.push({ raw: raw, label: getActionLabel(raw) });
        }
      }
      result.sort((a, b) => a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
      return result;
    });

    const filteredItems = computed(() => {
      const items = allItems.value;
      const search = (searchText.value || '').toLowerCase();
      const actionVal = actionFilter.value || '';
      return items.filter((item) => {
        const matchSearch = !search ||
          (item.formattedDate || '').toLowerCase().indexOf(search) !== -1 ||
          (item.userDisplay || '').toLowerCase().indexOf(search) !== -1 ||
          (item.actionLabel || '').toLowerCase().indexOf(search) !== -1 ||
          (item.action || '').toLowerCase().indexOf(search) !== -1 ||
          (item.targetDisplay || '').toLowerCase().indexOf(search) !== -1 ||
          (item.target_type || '').toLowerCase().indexOf(search) !== -1;
        const matchAction = !actionVal || item.action === actionVal;
        return matchSearch && matchAction;
      });
    });

    const resolvedPageSize = computed(() => {
      const ps = props.content && props.content.pageSize ? parseInt(props.content.pageSize, 10) : 25;
      return ps > 0 ? ps : 25;
    });

    const totalPages = computed(() => {
      const total = filteredItems.value.length;
      if (total === 0) return 1;
      return Math.ceil(total / resolvedPageSize.value);
    });

    const safePage = computed(() => {
      const tp = totalPages.value;
      const cp = currentPage.value;
      if (cp < 1) return 1;
      if (cp > tp) return tp;
      return cp;
    });

    const pagedItems = computed(() => {
      const start = (safePage.value - 1) * resolvedPageSize.value;
      const end = start + resolvedPageSize.value;
      return filteredItems.value.slice(start, end);
    });

    const goToPage = (page) => {
      const tp = totalPages.value;
      const clamped = page < 1 ? 1 : (page > tp ? tp : page);
      currentPage.value = clamped;
      emit('trigger-event', {
        name: 'page-change',
        event: { page: clamped, pageSize: resolvedPageSize.value, offset: (clamped - 1) * resolvedPageSize.value },
      });
    };

    watch(allItems, (val) => { setItemCount(val.length); }, { immediate: true });
    watch(filteredItems, (val) => { setFilteredCount(val.length); }, { immediate: true });
    watch(safePage, (val) => { setCurrentPageVar(val); }, { immediate: true });
    watch(totalPages, (val) => {
      setTotalPagesVar(val);
      if (currentPage.value > val) currentPage.value = val > 0 ? val : 1;
    }, { immediate: true });

    const handleRowClick = (item) => {
      setSelectedItem(item._raw || item);
      emit('trigger-event', { name: 'row-click', event: { row: item._raw || item } });
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

.alc-count {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  padding-bottom: 4px;
}
</style>
