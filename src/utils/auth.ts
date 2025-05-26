import Cookies from 'js-cookie';

const TokenKey: string = 'token';
const Name: string = 'name';
const UserId: string = 'uid';

// 设置token过期时间为7天
const TOKEN_EXPIRES_DAYS = 7;

export function getToken(): string | undefined {
  const token = Cookies.get(TokenKey);
  // 同时检查localStorage
  if (!token && localStorage.getItem(TokenKey)) {
    return localStorage.getItem(TokenKey) || undefined;
  }
  return token;
}

export function setToken(token: string): void {
  // 设置7天有效期的token
  const expires = new Date(new Date().getTime() + TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  
  // 同时存储在Cookies和localStorage中
  Cookies.set(TokenKey, token, { expires });
  localStorage.setItem(TokenKey, token);
  
  // 记录token设置时间
  localStorage.setItem('tokenTime', new Date().toString());
  
  // 设置过期时间
  localStorage.setItem('tokenExpires', expires.toString());
}

export function removeToken(): void {
  // 同时从Cookies和localStorage中移除
  Cookies.remove(TokenKey);
  localStorage.removeItem(TokenKey);
  localStorage.removeItem('tokenTime');
  localStorage.removeItem('tokenExpires');
}

export function isTokenExpired(): boolean {
  const expiresStr = localStorage.getItem('tokenExpires');
  if (!expiresStr) return true;
  
  const expires = new Date(expiresStr);
  return new Date() > expires;
}

export function getName(): string | undefined {
  const name = Cookies.get(Name);
  // 同时检查localStorage
  if (!name && localStorage.getItem(Name)) {
    return localStorage.getItem(Name) || undefined;
  }
  return name;
}

export function setName(name: string): void {
  // 同时存储在Cookies和localStorage中，使用与token相同的有效期
  const expires = new Date(new Date().getTime() + TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  Cookies.set(Name, name, { expires });
  localStorage.setItem(Name, name);
}

export function removeName(): void {
  // 同时从Cookies和localStorage中移除
  Cookies.remove(Name);
  localStorage.removeItem(Name);
}

export function getUserId(): string | undefined {
  const uid = Cookies.get(UserId);
  // 同时检查localStorage
  if (!uid && localStorage.getItem(UserId)) {
    return localStorage.getItem(UserId) || undefined;
  }
  return uid;
}

export function setUserId(uid: string): void {
  // 同时存储在Cookies和localStorage中，使用与token相同的有效期
  const expires = new Date(new Date().getTime() + TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  Cookies.set(UserId, uid, { expires });
  localStorage.setItem(UserId, uid);
}

export function removeUserId(): void {
  // 同时从Cookies和localStorage中移除
  Cookies.remove(UserId);
  localStorage.removeItem(UserId);
}

// 清除所有认证信息
export function clearAuth(): void {
  removeToken();
  removeName();
  removeUserId();
}