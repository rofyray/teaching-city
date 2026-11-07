/**
 * Joins class names without tailwind-merge, for code that runs in the browser (it saves about
 * 9 KB of JavaScript). Callers must not pass conflicting utilities; use `cn` on the server.
 */
export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
