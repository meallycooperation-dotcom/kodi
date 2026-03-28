import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CheckEmailSent = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="text-gray-700 mb-4">
          A password reset link has been sent to{' '}
          <strong>{email || 'your email address'}</strong>.
        </p>
        <p className="text-gray-600 mb-6">
          Open your inbox and click the link. If you don’t see it, check your spam folder.
        </p>
        <Link
          to="/auth/login"
          className="w-full block bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default CheckEmailSent;
