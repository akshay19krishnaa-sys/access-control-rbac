
export function hasAtLeastOnePermission(permissions) {
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
    return false;
  }
  return Object.values(permissions).some((actions) => {
    if (!actions || typeof actions !== 'object' || Array.isArray(actions)) {
      return false;
    }
    return Object.values(actions).some((val) => val === true);
  });
}
