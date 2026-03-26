import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <p>Loading user profile…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      {user ? (
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
      ) : (
        <div className="card">
          <p>No user signed in.</p>
        </div>
      )}
    </section>
  );
};

export default Settings;
