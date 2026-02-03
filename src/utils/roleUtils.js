function isAdminRole(role) {
  if (role === undefined || role === null) return false;
  const r = String(role).toLowerCase();
  return r === 'admin' || r === 'master' || r === '4' || r === 'super' || r === 'root';
}

module.exports = { isAdminRole };
