export default {
  editor: {
    label: 'Audit Log Cards',
    icon: 'list',
  },
  properties: {
    data: {
      label: { en: 'Audit Log Data' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(item) {
          return item.action || item.id || 'Log Entry';
        },
        item: {
          type: 'Object',
          defaultValue: {
            id: 1,
            created_at: '',
            tenant_id: 1,
            user_id: 1,
            action: '',
            target_type: '',
            target_id: 1,
            meta: null
          },
          options: {
            item: {
              id: { label: { en: 'ID' }, type: 'Number' },
              created_at: { label: { en: 'Created At' }, type: 'Text' },
              tenant_id: { label: { en: 'Tenant ID' }, type: 'Number' },
              user_id: { label: { en: 'User ID' }, type: 'Number' },
              action: { label: { en: 'Action' }, type: 'Text' },
              target_type: { label: { en: 'Target Type' }, type: 'Text' },
              target_id: { label: { en: 'Target ID' }, type: 'Number' },
              meta: { label: { en: 'Meta' }, type: 'Text' }
            }
          }
        }
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array of audit log objects from Xano'
      },
      /* wwEditor:end */
    },
    pageSize: {
      label: { en: 'Page Size' },
      type: 'Number',
      section: 'settings',
      defaultValue: 25,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Number of records to show per page. Default: 25'
      },
      propertyHelp: 'How many cards to display per page',
      /* wwEditor:end */
    },
    dataIdFormula: {
      label: { en: 'ID Field' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content.data) && content.data.length > 0 ? content.data[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['id']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data.length || !boundProps.data,
    },
    dataNameFormula: {
      label: { en: 'Action Field' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content.data) && content.data.length > 0 ? content.data[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['action']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data.length || !boundProps.data,
    },
    dataActionFormula: {
      label: { en: 'Action Filter Field' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content.data) && content.data.length > 0 ? content.data[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['action']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data.length || !boundProps.data,
    },
  },
  triggerEvents: [
    {
      name: 'row-click',
      label: { en: 'On row click' },
      event: { row: {} },
      default: true,
    },
    {
      name: 'page-change',
      label: { en: 'On page change' },
      event: { page: 1, pageSize: 25, offset: 0 },
    },
  ],
};
