import axios from 'axios';

export const API = process.env.REACT_APP_API;         // e.g. /api  (proxied)
export const APIURL = process.env.REACT_APP_APIURL;   // e.g. https://api.notreal003.org
export const MAIN_API = process.env.REACT_APP_MAIN_API;

export function getToken() {
  return (
    document.cookie
      .split('; ')
      .find(row => row.startsWith('token'))
      ?.split('=')[1] || ''
  );
}

export function getAuthHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    authorization: `${getToken()}`,
    ...extra,
  };
}

const apiClient = axios.create({ withCredentials: true });

apiClient.interceptors.request.use(config => {
  if (!config.headers['authorization']) {
    config.headers['authorization'] = `${getToken()}`;
  }
  return config;
});

export default apiClient;
