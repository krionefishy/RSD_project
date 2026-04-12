const ACCESS_TOKEN_KEY = "rsd_access_token";
const REFRESH_TOKEN_KEY = "rsd_refresh_token";
const USER_ID_KEY = "rsd_user_id";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getCurrentUserId = () => localStorage.getItem(USER_ID_KEY);

export const setAuthSession = ({ accessToken, refreshToken, userId }) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (userId) localStorage.setItem(USER_ID_KEY, userId);
};

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

export const isAuthenticated = () => !!getAccessToken();
