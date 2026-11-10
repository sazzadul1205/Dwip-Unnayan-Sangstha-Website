const resolveImageUrl = (imagePath, storageUrl = '') => {
  if (typeof imagePath !== 'string' || !imagePath.trim()) return null;

  const path = imagePath.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;
  if (path.startsWith('/') && !path.startsWith('/storage/')) return path;

  const cleanPath = path.replace(/^\/?storage\//, '').replace(/^\/+/, '');
  const storageRoot = storageUrl.replace(/\/+$/, '');

  if (storageRoot) return `${storageRoot}/${cleanPath}`;
  return `/storage/${cleanPath}`;
};

export default resolveImageUrl;
