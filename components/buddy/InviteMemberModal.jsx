
import { useState } from 'react';
import { MdClose, MdMail } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function InviteMemberModal({ isOpen, onClose, groupId }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getCSRFToken = async () => {
    const res = await fetch('/api/csrf-token');
    const payload = await res.json();
    if (!res.ok || !payload?.csrfToken) {
      throw new Error('Unable to get security token. Please refresh and try again.');
    }
    return payload.csrfToken;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/buddy/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ email, groupId })
      });

      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          res.status === 401
            ? 'Your session expired. Please log in again.'
            : `Unexpected server response (${res.status}). ${text.slice(0, 120)}`
        );
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to send invite');

      toast.success('Invite sent!');
      setEmail('');
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-terracotta-50 rounded-full text-terracotta-600">
              <MdMail />
            </span>
            Invite Friend
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Friend's Email</label>
            <input 
              autoFocus
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none font-medium"
              required
            />
          </div>

          <div className="flex gap-3">
             <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-terracotta-600 text-white font-bold py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
