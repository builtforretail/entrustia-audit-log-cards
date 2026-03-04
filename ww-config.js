export default {
  editor: {
    label: 'Entrustia Portal Cards',
    icon: 'grid',
  },
  properties: {
    data: {
      label: { en: 'Portal Data' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: false,
        item: {
          type: 'Object',
          defaultValue: {},
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Bind to the upload_portal collection. Each item must include: id, name, is_enabled, allowed_mime_patterns, max_bytes, instructions, expires_at, captcha_required, folder_id.',
      },
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
      label: { en: 'Name Field' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content.data) && content.data.length > 0 ? content.data[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['name']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data.length || !boundProps.data,
    },
    dataIsEnabledFormula: {
      label: { en: 'Is Enabled Field' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content.data) && content.data.length > 0 ? content.data[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['is_enabled']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data.length || !boundProps.data,
    },
  },
  triggerEvents: [
    {
      name: 'open-click',
      label: { en: 'On Open click' },
      event: { row: null },
    },
    {
      name: 'edit-click',
      label: { en: 'On Edit click' },
      event: { row: null },
    },
    {
      name: 'name-click',
      label: { en: 'On Page Name click' },
      event: { row: null },
    },
  ],
};
