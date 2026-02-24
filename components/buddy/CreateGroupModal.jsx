
import { useState } from 'react';
import { MdClose, MdGroupAdd } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateGroupModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    e?.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/buddy/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ name })
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

      if (!res.ok) throw new Error(data?.error || 'Failed to create group');

      toast.success('Group created successfully!');
      onCreated?.(data.data);
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-cyan-50 rounded-full text-cyan-500">
              <MdGroupAdd />
            </span>
            Create Buddy Group
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Group Name</label>
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Dream Team, Dublin Hunters..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none font-medium"
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
              className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.98]"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
