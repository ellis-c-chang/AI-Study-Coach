import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000',  // Flask backend URL
  withCredentials: true,  // For handling cookies if needed later
});

export default API;
