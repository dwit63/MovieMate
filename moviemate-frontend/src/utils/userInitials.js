export const getUserInitials = (user = {}) => {
  const source = (user.name || user.email || '').trim();

  if (!source) return 'U';

  const nameParts = source.split(/\s+/).filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }

  const emailName = source.includes('@') ? source.split('@')[0] : source;
  return emailName.slice(0, 1).toUpperCase() || 'U';
};
