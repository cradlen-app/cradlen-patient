export type Locale = "en" | "ar";

/**
 * Loader returning a module's translation slice for the requested locale.
 * The kernel auto-wraps the returned object under the module's i18nNamespace
 * before merging it into the global message tree, so authors write unwrapped keys.
 */
export type MessagesLoader = (locale: Locale) => Promise<Record<string, unknown>>;
