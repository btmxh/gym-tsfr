import { getUserLocale } from "@/services/locale";

type Messages = {
  API: {
    errors: Record<string, string>;
    success: Record<string, string>;
  };
  [key: string]: Record<string, unknown>;
};

const cachedMessages: { [locale: string]: Messages } = {};

/**
 * Get messages for the current locale
 */
export async function getMessages(): Promise<Messages> {
  const locale = await getUserLocale();
  
  if (!cachedMessages[locale]) {
    cachedMessages[locale] = (await import(`../../messages/${locale}.json`)).default;
  }
  
  return cachedMessages[locale];
}

/**
 * Get a specific translation by key path
 * @param keyPath - dot-separated path like "API.errors.unauthorized"
 * @returns The translated message or the key if not found
 */
export async function t(keyPath: string): Promise<string> {
  const messages = await getMessages();
  const keys = keyPath.split(".");
  
  let value: unknown = messages;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return keyPath; // Return key if translation not found
    }
  }
  
  return typeof value === "string" ? value : keyPath;
}

/**
 * Get translation namespace (useful for getting multiple related translations)
 */
export async function getNamespace(namespace: string): Promise<Record<string, unknown>> {
  const messages = await getMessages();
  const keys = namespace.split(".");
  
  let value: unknown = messages;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return {};
    }
  }
  
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
}
