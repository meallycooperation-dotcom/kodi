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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        {success && <p className="text-green-600 mt-4 text-center">{success}</p>}

        <div className="text-center mt-4 text-sm">
          <a href="/auth/login" className="text-purple-600 font-semibold">Back to login</a>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
