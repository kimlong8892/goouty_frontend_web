# 🌍 Internationalization (i18n) Guide

## Overview

Ứng dụng Goouty sử dụng **Tiếng Việt** làm ngôn ngữ mặc định và duy nhất cho người dùng.

i18n infrastructure được thiết lập sẵn để dễ dàng mở rộng sang các ngôn ngữ khác trong tương lai nếu cần.

## Supported Languages

- 🇻🇳 **Vietnamese (vi)** - Default & Only language for users
- 🇬🇧 **English (en)** - Available in codebase for future expansion

## Setup

### Dependencies

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### Structure

```
src/i18n/
├── config.ts           # i18n configuration
├── index.ts            # Export file
└── locales/
    ├── vi.json         # Vietnamese translations
    └── en.json         # English translations
```

## Usage

### 1. In Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <p>{t('template.description')}</p>
    </div>
  );
}
```

### 2. With Variables

```tsx
// Translation key with variable
{t('template.templatesFound', { count: 5 })}

// In vi.json:
"templatesFound": "Tìm thấy {{count}} mẫu chuyến đi"

// In en.json:
"templatesFound": "{{count}} template(s) found"
```

## Translation Keys Structure

### Common Keys
```json
{
  "common": {
    "loading": "...",
    "save": "...",
    "cancel": "...",
    ...
  }
}
```

### Feature-specific Keys
```json
{
  "trip": { ... },
  "template": { ... },
  "profile": { ... },
  "auth": { ... },
  ...
}
```

## Adding New Translations

### 1. Add to both language files

**vi.json:**
```json
{
  "myFeature": {
    "title": "Tiêu đề của tôi",
    "description": "Mô tả"
  }
}
```

**en.json:**
```json
{
  "myFeature": {
    "title": "My Title",
    "description": "Description"
  }
}
```

### 2. Use in component

```tsx
{t('myFeature.title')}
{t('myFeature.description')}
```

## Adding New Languages (For Future Expansion)

### 1. Create translation file

Create `src/i18n/locales/[language-code].json`

Example for Japanese:
```json
// src/i18n/locales/ja.json
{
  "common": {
    "loading": "読み込み中...",
    ...
  }
}
```

### 2. Update config

```typescript
// src/i18n/config.ts
import ja from './locales/ja.json';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
  ja: { translation: ja }  // Add new language
};
```

### 3. Enable language switching (if needed)

If you want to allow users to switch languages in the future, create a LanguageSwitcher component.

## Best Practices

### 1. Use Namespaces

Group related translations together:
```json
{
  "trip": { ... },
  "template": { ... },
  "profile": { ... }
}
```

### 2. Consistent Key Naming

- Use camelCase: `myFeature.someKey`
- Be descriptive: `trip.createNewTrip` instead of `trip.create`
- Group by feature: `trip.*`, `template.*`, etc.

### 3. Avoid Hardcoded Text

❌ Bad:
```tsx
<h1>Mẫu chuyến đi</h1>
```

✅ Good:
```tsx
<h1>{t('template.templates')}</h1>
```

### 4. Handle Plurals

```json
{
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}
```

```tsx
{t('itemCount', { count: items.length })}
```

## Current Language

The app **always uses Vietnamese (vi)** as the default and only language for users.

English translations are maintained in the codebase for potential future expansion.

## Current Coverage

### Fully Translated Components

- ✅ PWATripTemplatesList
- ✅ LanguageSwitcher

### To Be Translated

- ⏳ Navbar
- ⏳ AuthPage
- ⏳ Profile pages
- ⏳ Trip pages
- ⏳ Notification pages
- ⏳ Settings pages

## Troubleshooting

### Translation not showing

1. Check if key exists in both `vi.json` and `en.json`
2. Verify key path is correct: `t('namespace.key')`
3. Check console for i18n errors
4. Ensure i18n is initialized in `main.tsx`

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Browser Language Detector](https://github.com/i18next/i18next-browser-languageDetector)

---

**Note**: Always add translations to BOTH `vi.json` and `en.json` when adding new features.
