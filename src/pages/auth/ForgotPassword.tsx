import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return alert('Please enter your email.');
    }

    try {
      setLoading(true);
      setSuccess('');

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/auth/new-password',
      });

      if (error) throw error;
      setSuccess('If that email exists, a password reset link has been sent. Check your inbox.');
    } catch (err: any) {
      alert(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        {success && <p className="text-green-600 mt-4 text-center">{success}</p>}

        <div className="auth-links">
          <p>
            <a href="/auth/login" className="auth-link">Back to login</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
