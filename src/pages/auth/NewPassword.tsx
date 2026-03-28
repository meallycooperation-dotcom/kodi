import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

type SessionState = 'idle' | 'loading' | 'ready' | 'error';

const NewPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [sessionError, setSessionError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const restoreSession = async () => {
      setSessionState('loading');
      const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

      if (error) {
        setSessionError(
          error.message || 'We could not verify this password reset link. Please request a new one.'
        );
        setSessionState('error');
        return;
      }

      setSessionState('ready');
    };

    restoreSession();
  }, []);

  const canSubmit = sessionState === 'ready';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (!password || !confirmPassword) {
      setFormError('Please fill out both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords must match.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password should be at least 8 characters long.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFormError(error.message || 'Unable to update your password.');
      return;
    }

    await supabase.auth.signOut();
    navigate('/auth/login', { state: { passwordReset: true } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create a new password</h2>

        {sessionState === 'loading' && (
          <p className="text-sm text-gray-600 mb-4">Validating your reset link…</p>
        )}
        {sessionError && (
          <p className="text-sm text-red-600 mb-4" role="alert">
            {sessionError}
          </p>
        )}

        <input
          type="password"
          name="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
          required
          disabled={!canSubmit || submitting}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
          required
          disabled={!canSubmit || submitting}
        />

        {formError && (
          <p className="text-sm text-red-600 mb-4" role="alert">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {submitting ? 'Updating password…' : 'Set new password'}
        </button>

        <div className="text-center mt-4 text-sm">
          <Link to="/auth/login" className="text-purple-600 font-semibold">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default NewPassword;
