import React, { useState } from 'react';
import { login, register } from '../services/authService';

const LoginForm = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await register({ username, email, password });
        const userData = await login({ email, password });
        // Store user ID properly based on the actual response structure
        if (userData && userData.user_id) {
          localStorage.setItem("user_id", userData.user_id);
        } else if (userData && userData.id) {
          localStorage.setItem("user_id", userData.id);
        }
        setUser({
          ...userData,
          isNewUser: true
        });
      } else {
        const userData = await login({ email, password });
        // Store user ID properly based on the actual response structure
        if (userData && userData.user_id) {
          localStorage.setItem("user_id", userData.user_id);
        } else if (userData && userData.id) {
          localStorage.setItem("user_id", userData.id);
        }
        setUser(userData);
      }
    } catch (err) {
      console.error(err);
      alert('Authentication failed, please check your credentials.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl border border-gray-200">
        
        {/* Software Name - Highlighted */}
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
          AI Study Coach
        </h1>

        <h2 className="text-2xl font-semibold text-center text-gray-800">
          {isRegistering ? 'Create an Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none"
          />
          
          <button
            type="submit"
            className="w-full p-3 text-white bg-gradient-to-r from-blue-400 to-green-400 rounded-md hover:opacity-90 transition"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-blue-500 hover:underline text-center mt-2"
        >
          {isRegistering ? 'Already have an account? Login' : 'New user? Click here to register!'}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
