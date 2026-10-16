/**
 * permissionValidator.js
 * Business rule validator for RBAC permissions.
 */

/**
 * Checks if a permissions object has at least one permission set to true.
 * Returns false if null, undefined, empty, not an object, or all values are false.
 * @param {object} permissions
 * @returns {boolean}
 */
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
