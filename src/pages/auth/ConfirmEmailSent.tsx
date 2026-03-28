import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const knownEmailClients: Record<string, string> = {
  'gmail.com': 'https://mail.google.com/mail/u/0/#inbox',
  'googlemail.com': 'https://mail.google.com/mail/u/0/#inbox',
  'outlook.com': 'https://outlook.live.com/mail/0/',
  'hotmail.com': 'https://outlook.live.com/mail/0/',
  'live.com': 'https://outlook.live.com/mail/0/',
  'msn.com': 'https://outlook.live.com/mail/0/',
  'yahoo.com': 'https://mail.yahoo.com',
  'yahoo.co.uk': 'https://mail.yahoo.com',
  'icloud.com': 'https://www.icloud.com/mail',
  'aol.com': 'https://mail.aol.com',
  'proton.me': 'https://mail.proton.me/u/0/inbox',
  'protonmail.com': 'https://mail.proton.me/u/0/inbox',
  'zoho.com': 'https://mail.zoho.com',
  'fastmail.com': 'https://www.fastmail.com/login'
};

const getEmailClientUrl = (email: string) => {
  const safeEmail = email.trim();
  if (!safeEmail) {
    return 'mailto:';
  }

  const domain = safeEmail.split('@')[1]?.toLowerCase();
  if (domain && knownEmailClients[domain]) {
    return knownEmailClients[domain];
  }

  return `mailto:${encodeURIComponent(safeEmail)}`;
};

const handleOpenEmail = (email: string) => {
  const url = getEmailClientUrl(email);
  if (url.startsWith('http')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.href = url;
};

const ConfirmEmailSent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationEmail = (location.state as { email?: string } | null)?.email || '';

  const resolvedEmail = useMemo(() => {
    if (locationEmail) {
      return locationEmail;
    }

    if (typeof window === 'undefined') {
      return '';
    }

    return localStorage.getItem('pendingVerificationEmail') || '';
  }, [locationEmail]);

  useEffect(() => {
    if (resolvedEmail) {
      localStorage.setItem('pendingVerificationEmail', resolvedEmail);
    }
  }, [resolvedEmail]);

  const emailDomain = resolvedEmail.split('@')[1]?.toLowerCase();
  const buttonLabel = resolvedEmail
    ? `Open ${emailDomain ? `${emailDomain} inbox` : 'email provider'}`
    : 'Open email';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Verify your email</h2>
        <p className="mb-4 text-gray-700">
          A confirmation email has been sent to <strong>{resolvedEmail || 'your email address'}</strong>.
          Please check your inbox and click the verification link.
        </p>
        <button
          type="button"
          onClick={() => handleOpenEmail(resolvedEmail)}
          className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold mb-3 hover:bg-purple-700"
        >
          {buttonLabel}
        </button>
        <button
          type="button"
          onClick={() => navigate('/auth/login')}
          className="w-full border border-purple-600 text-purple-600 p-3 rounded-lg font-semibold hover:bg-purple-50"
        >
          Back to login
        </button>
      </div>
    </div>
  );
};

export default ConfirmEmailSent;
