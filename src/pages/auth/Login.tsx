import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        window.location.href = '/dashboard';
      }
    };

    checkUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });
      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <form onSubmit={handleLogin} className="auth-form">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to Kodi</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="auth-links">
          <p>
            <a href="/auth/forgot-password" className="auth-link">
              Forgot password?
            </a>
          </p>
          <p>
            Don’t have an account?{' '}
            <a href="/auth/signup" className="auth-link">
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
