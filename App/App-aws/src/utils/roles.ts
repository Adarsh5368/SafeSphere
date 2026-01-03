import { USER_TYPES, type UserType } from './constants';

export const isParent = (userType: UserType): boolean => {
  return userType === USER_TYPES.PARENT;
};

export const isChild = (userType: UserType): boolean => {
  return userType === USER_TYPES.CHILD;
};

export const getDefaultRoute = (userType: UserType): string => {
  return isParent(userType) ? '/parent/dashboard' : '/child/dashboard';
};

export const getRestrictedRoutes = (userType: UserType): string[] => {
  if (isParent(userType)) {
    return ['/child'];
  } else {
    return ['/parent'];
  }
};

export const canAccessRoute = (userType: UserType, route: string): boolean => {
  const restrictedRoutes = getRestrictedRoutes(userType);
  return !restrictedRoutes.some(restricted => route.startsWith(restricted));
};