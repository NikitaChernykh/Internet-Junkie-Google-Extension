var APP_TRANSLATIONS = {
  lang: chrome.i18n.getMessage("lang"),
  home: {
    today_text: chrome.i18n.getMessage("today_text"),
    websites_label: chrome.i18n.getMessage("websites_label"),
    visits_label: chrome.i18n.getMessage("visits_label"),
    time_label: chrome.i18n.getMessage("time_label"),
    placeholder_msg: chrome.i18n.getMessage("placeholder_msg"),
    total_text: chrome.i18n.getMessage("total_text"),
    visits_text: chrome.i18n.getMessage("visits_text"),
    abbr_min: chrome.i18n.getMessage("abbr_min"),
    abbr_sec: chrome.i18n.getMessage("abbr_sec"),
    abbr_days: chrome.i18n.getMessage("abbr_days"),
    abbr_hours: chrome.i18n.getMessage("abbr_hours")
  },
  settings: {
    settings_title: chrome.i18n.getMessage("settings_title"),
    settings_del: chrome.i18n.getMessage("settings_del"),
    settings_btn_clear: chrome.i18n.getMessage("settings_btn_clear"),
    settings_add_blacklist: chrome.i18n.getMessage("settings_add_blacklist"),
    settings_btn_blacklist: chrome.i18n.getMessage("settings_btn_blacklist"),
    settings_btn_goback: chrome.i18n.getMessage("settings_btn_goback")
  }
};
module.exports = APP_TRANSLATIONS;
