export const EVENT = {
  APP_CLOSE: 'app-close',
  APP_HIDE: 'app-hide',
  APP_INIT: 'app-init',
  APP_SHOW: 'app-show',
  APP_STATS: 'app-stats',

  ITEM_DELETE: 'item-delete',
  ITEM_NEW: 'item-new',
  ITEM_NEXT: 'item-next',
  ITEM_PREVIOUS: 'item-previous',
  ITEM_RENDER: 'item-render',
  ITEM_SEARCH: 'item-search',
  ITEM_COPY: 'item-copy',

  ITEMS_SAVE: 'items-save',
  ITEMS_RESTORE: 'items-restore',
  ITEMS_CLEAR: 'items-clear',

  SETTINGS_UPDATE: 'settings-update', // From main -> renderer
  SETTINGS_CHANGE: 'settings-change', // From renderer -> main
  SETTINGS_HIDE: 'settings-hide',
  SETTINGS_SHOW: 'settings-show',

  COPY_TO_CLIPBOARD: 'copy-to-clipboard'
};
