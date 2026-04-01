import { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../services/profileService';
import { useCurrency } from '../../context/currency';

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const { selectedCurrency, setSelectedCurrency, availableCurrencies, loading: currencyLoading } =
    useCurrency();
  const navigate = useNavigate();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changePassword(newPassword);

      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <p>Loading user profile..</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      {user ? (
        <div className="space-y-6">
          <div className="card">
            <h2>User information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd>{user.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  navigate('/auth/login');
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2>Currency</h2>
              {currencyLoading && (
                <span className="text-sm text-gray-500">Updating exchange rates...</span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Choose the currency you want to see throughout the dashboard.
            </p>
            <select
              className="w-full max-w-xs rounded-lg border border-gray-200 p-2"
              value={selectedCurrency}
              onChange={(event) => setSelectedCurrency(event.target.value)}
              disabled={currencyLoading}
            >
              {availableCurrencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2>Change Password</h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  type="password"
                  label="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />

                {passwordMessage && (
                  <div
                    className={`p-3 rounded text-sm ${
                      passwordMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <p>No user signed in.</p>
        </div>
      )}
    </section>
  );
};

export default Settings;
