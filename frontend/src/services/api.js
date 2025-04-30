// frontend/src/services/api.js
import axios from 'axios';

/**
 * 说明
 * ──────────────────────────────────────────
 * 1. 本地开发   → 默认走 http://127.0.0.1:5000
 * 2. 线上部署   → 在 Vercel (或其它平台) 的环境变量里配置
 *                REACT_APP_API_URL=https://ai-study-coach.onrender.com
 *    CRA 会在构建时把 REACT_APP_ 前缀的变量注入到前端代码里。
 */
const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

/* ────────── token 注入 ────────── */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ────────── 网络错误自动重试一次 ────────── */
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { message, code, config } = error;

    const isResourceErr =
      message === 'Network Error' || code === 'ERR_INSUFFICIENT_RESOURCES';

    if (isResourceErr && !config._retry) {
      console.warn('[API] network issue, retrying once…');
      await new Promise((r) => setTimeout(r, 2000)); // 等 2 秒
      config._retry = true;
      return API(config);
    }
    return Promise.reject(error);
  }
);

export default API;
