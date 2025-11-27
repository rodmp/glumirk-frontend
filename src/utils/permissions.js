/**
 * Sistema de permisos basado en roles
 */

export const ROLES = {
  SUPER_USER: 'SUPER_USER',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER',
  SELLER: 'SELLER',
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = (user, role) => {
  if (!user || !user.role) return false
  return user.role === role
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role) return false
  return roles.includes(user.role)
}

/**
 * Permisos por página
 */
export const canViewPage = (user, page) => {
  if (!user || !user.role) return false

  const role = user.role

  // SUPER_USER puede ver todo
  if (role === ROLES.SUPER_USER) return true

  // VIEWER solo puede ver Ventas y Reportes
  if (role === ROLES.VIEWER) {
    return ['/', '/sales', '/reports'].includes(page)
  }

  // SELLER puede ver Ventas, Inventario y Reportes
  if (role === ROLES.SELLER) {
    return ['/', '/sales', '/inventory', '/reports'].includes(page)
  }

  // ADMIN puede ver todo excepto Roles y Usuarios (pero puede verlos, solo no crear)
  if (role === ROLES.ADMIN) {
    return true // Puede ver todas las páginas
  }

  return false
}

/**
 * Permisos para crear/editar/eliminar
 */
export const canCreate = (user, resource) => {
  if (!user || !user.role) return false

  const role = user.role

  // SUPER_USER puede crear todo, incluyendo usuarios y roles
  if (role === ROLES.SUPER_USER || role === 'SUPER_USER') return true

  // VIEWER no puede crear nada
  if (role === ROLES.VIEWER || role === 'VIEWER') return false

  // SELLER no puede crear ventas ni actualizar inventario ni items
  if (role === ROLES.SELLER || role === 'SELLER') {
    if (resource === 'sales' || resource === 'inventory' || resource === 'items') return false
    return false // No puede crear nada más
  }

  // ADMIN no puede crear Roles ni Usuarios
  if (role === ROLES.ADMIN || role === 'ADMIN') {
    if (resource === 'roles' || resource === 'users') return false
    return true
  }

  return false
}

export const canUpdate = (user, resource) => {
  return canCreate(user, resource) // Mismo permiso que crear
}

export const canDelete = (user, resource) => {
  return canCreate(user, resource) // Mismo permiso que crear
}

