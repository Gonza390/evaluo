import type { AppLocale } from './app-locale';

/** Settings-page messages: loaded separately from the lightweight app shell. */
export const settingsMessages = {
  es: {
    title: 'Configuración',
    subtitle: 'Administrá tu cuenta y tus datos de estudio.',
    general: 'General',
    language: 'Idioma',
    appearance: 'Apariencia',
    light: 'Claro',
    themeUnavailable: 'La apariencia todavía no se puede modificar.',
    languageHelp: 'La traducción de las demás pantallas está en desarrollo.',
    savingLanguage: 'Guardando idioma…',
    languageSaveError: 'No pudimos guardar el idioma. Volvé a intentarlo.',
  },
  en: {
    title: 'Settings',
    subtitle: 'Manage your account and study details.',
    general: 'General',
    language: 'Language',
    appearance: 'Appearance',
    light: 'Light',
    themeUnavailable: 'Appearance settings cannot be changed yet.',
    languageHelp: 'Translation of the remaining screens is in progress.',
    savingLanguage: 'Saving language…',
    languageSaveError: 'We could not save your language. Please try again.',
  },
} as const satisfies Record<AppLocale, Record<string, string>>;
