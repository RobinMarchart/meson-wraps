export function fixSlashUrl(url: string) {
  const uurl = url.trim();
  if (uurl.endsWith(`/`)) {
    return uurl.slice(0, -1);
  }
  return uurl;
}
