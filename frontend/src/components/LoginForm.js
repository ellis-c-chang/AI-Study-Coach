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
        alert('Registered successfully!');
        setIsRegistering(false);
      } else {
        const userData = await login({ email, password });
        setUser(userData);
        alert('Login successful!');
      }
    } catch (err) {
      console.error(err);
      alert('Authentication failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 shadow-lg rounded-lg bg-white">
      {isRegistering && (
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full p-2 border rounded mb-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full p-2 border rounded mb-2"
      />
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
        {isRegistering ? 'Register' : 'Login'}
      </button>
      <button
        type="button"
        onClick={() => setIsRegistering(!isRegistering)}
        className="mt-2 text-blue-500"
      >
        {isRegistering ? 'Have an account? Login' : 'New user? Register'}
      </button>
    </form>
  );
};

export default LoginForm;
