export function readInvitationToken(hash: string): string | null {
  const search = hash.startsWith("#") ? hash.slice(1) : hash;
  const token = new URLSearchParams(search).get("token");
  return token?.trim() ? token : null;
}
