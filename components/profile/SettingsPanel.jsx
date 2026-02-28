'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/core/contexts/AuthContext';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MdLock,
  MdNotifications,
  MdEmail,
  MdDeleteForever,
  MdWarning,
  MdPublic,
  MdPerson,
  MdCheck,
  MdChevronRight,
  MdExpandMore,
} from 'react-icons/md';

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={(e) => { e.stopPropagation(); !disabled && onChange(!enabled); }}
      disabled={disabled}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-terracotta-500 disabled:opacity-40 disabled:cursor-not-allowed ${
        enabled
          ? 'bg-terracotta-500 shadow-md shadow-terracotta-500/30'
          : 'bg-navy-100 border border-navy-200'
      }`}
    >
      {/* Knob */}
      <span
        className={`absolute inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ${
          enabled ? 'translate-x-8 shadow-terracotta-500/20' : 'translate-x-1'
        }`}
      >
        {/* Inner dot — shows terracotta when active */}
        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
          enabled ? 'bg-terracotta-400 scale-100' : 'bg-navy-300 scale-75'
        }`} />
      </span>
    </button>
  );
}


// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({ icon: Icon, title, description, badge, danger = false, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${danger ? 'border-2 border-red-100' : 'border border-navy-100'}`}>
      {/* Header (always visible, clickable) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors ${open ? 'bg-navy-50/50' : 'hover:bg-navy-50/40'}`}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50 border border-red-100' : 'bg-navy-50 border border-navy-100'}`}>
          <Icon size={20} className={danger ? 'text-red-500' : 'text-navy-500'} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className={`font-heading font-bold text-sm ${danger ? 'text-red-700' : 'text-navy-950'}`}>{title}</div>
          <div className={`text-xs mt-0.5 ${danger ? 'text-red-400' : 'text-navy-400'}`}>{description}</div>
        </div>

        {/* Badge + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="bg-terracotta-50 text-terracotta-600 border border-terracotta-100 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <MdExpandMore size={22} className={danger ? 'text-red-400' : 'text-navy-400'} />
          </motion.div>
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-6 pb-6 pt-4 border-t ${danger ? 'border-red-100' : 'border-navy-50'}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Setting Row ───────────────────────────────────────────────────────────────
function SettingRow({ label, description, enabled, onChange, saving }) {
  return (
    <div
      className="group flex items-center justify-between py-4 px-3 -mx-3 rounded-2xl hover:bg-navy-50/70 transition-colors cursor-pointer border-b border-navy-50 last:border-b-0"
      onClick={() => !saving && onChange(!enabled)}
    >
      <div className="pr-6 flex-1">
        <div className="font-heading font-semibold text-navy-900 text-sm">{label}</div>
        {description && (
          <div className="text-xs text-navy-400 mt-0.5 leading-relaxed font-sans">{description}</div>
        )}
      </div>
      {/* stopPropagation so the row click and button click don't double-fire */}
      <div onClick={(e) => e.stopPropagation()}>
        <Toggle enabled={enabled} onChange={onChange} disabled={saving} />
      </div>
    </div>
  );
}

// ─── Visibility Option ─────────────────────────────────────────────────────────
function VisibilityOption({ value, current, onChange, icon: Icon, label, description }) {
  const isActive = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
        isActive ? 'border-terracotta-500 bg-terracotta-50' : 'border-navy-100 bg-white hover:border-navy-200 hover:bg-navy-50'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'bg-terracotta-500 text-white' : 'bg-navy-100 text-navy-500'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-heading font-bold text-sm ${isActive ? 'text-terracotta-700' : 'text-navy-900'}`}>{label}</div>
        <div className="text-xs text-navy-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
      {isActive && (
        <div className="shrink-0 w-5 h-5 rounded-full bg-terracotta-500 flex items-center justify-center mt-0.5">
          <MdCheck size={12} className="text-white" />
        </div>
      )}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SettingsPanel() {
  const router = useRouter();
  const { user, signOut } = useAuthContext();

  const [saving, setSaving] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [settings, setSettings] = useState({
    privacy_setting: 'public',
    show_online_status: true,
    show_response_time: true,
    notif_new_messages: true,
    notif_interest: true,
    notif_mutual_match: true,
  });

  // Only sync from server on initial load (user.id change).
  // Do NOT re-sync on individual field changes — that would overwrite
  // local optimistic updates the user just made.
  useEffect(() => {
    if (!user) return;
    setSettings({
      privacy_setting: user.privacy_setting ?? 'public',
      show_online_status: user.show_online_status ?? true,
      show_response_time: user.show_response_time ?? true,
      notif_new_messages: user.notif_new_messages ?? true,
      notif_interest: user.notif_interest ?? true,
      notif_mutual_match: user.notif_mutual_match ?? true,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getCSRF = async () => {
    const res = await fetch('/api/csrf-token');
    const { csrfToken } = await res.json();
    return csrfToken;
  };

  const patchSetting = useCallback(async (field, value) => {
    // Optimistic update — toggle immediately for instant feedback
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaving(true);
    try {
      const csrfToken = await getCSRF();
      const res = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      // No refreshSession() here — that would re-fetch the user and overwrite
      // our local optimistic state with stale DB values (missing columns).
    } catch (err) {
      toast.error(err.message || 'Could not save setting');
      // Rollback the optimistic update
      setSettings(prev => ({ ...prev, [field]: !value }));
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== 'delete my account') {
      toast.error('Please type "delete my account" exactly.');
      return;
    }
    setDeleting(true);
    try {
      const csrfToken = await getCSRF();
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete account');
      }
      await signOut();
      toast.success('Your account has been deleted.');
      router.push('/');
    } catch (err) {
      toast.error(err.message || 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3 max-w-2xl">

      {/* ── Privacy ──────────────────────────────────────────────────────────── */}
      <AccordionSection
        icon={MdLock}
        title="Privacy"
        description="Control who can see your profile and activity."
        badge={settings.privacy_setting === 'private' ? 'Private' : 'Public'}
      >
        <div className="mb-5">
          <p className="text-xs font-heading font-bold text-navy-400 uppercase tracking-wider mb-3">Profile Visibility</p>
          <div className="space-y-3">
            <VisibilityOption
              value="public" current={settings.privacy_setting}
              onChange={(v) => patchSetting('privacy_setting', v)}
              icon={MdPublic} label="Public"
              description="Anyone on Roomly can view your profile and listings."
            />
            <VisibilityOption
              value="private" current={settings.privacy_setting}
              onChange={(v) => patchSetting('privacy_setting', v)}
              icon={MdPerson} label="Private"
              description="Only people you've connected with can see your full profile. Your listings remain visible."
            />
          </div>
        </div>

        <p className="text-xs font-heading font-bold text-navy-400 uppercase tracking-wider mb-1">Activity Signals</p>
        <div className="divide-y divide-navy-50">
          <SettingRow
            label="Show online status"
            description="Let others see a green dot when you're active on the app."
            enabled={settings.show_online_status}
            onChange={(v) => patchSetting('show_online_status', v)}
            saving={saving}
          />
          <SettingRow
            label="Show response time"
            description="Display your typical response time on your profile. Helpful for building trust."
            enabled={settings.show_response_time}
            onChange={(v) => patchSetting('show_response_time', v)}
            saving={saving}
          />
        </div>
      </AccordionSection>

      {/* ── Notifications ──────────────────────────────────────────────────── */}
      <AccordionSection
        icon={MdNotifications}
        title="Notification Preferences"
        description="Choose which email notifications you'd like to receive."
      >
        <div className="divide-y divide-navy-50">
          <SettingRow
            label="New messages"
            description="Get an email when someone sends you a direct message or replies in a conversation."
            enabled={settings.notif_new_messages}
            onChange={(v) => patchSetting('notif_new_messages', v)}
            saving={saving}
          />
          <SettingRow
            label="Someone's interested in your room"
            description="Receive an email when a seeker clicks 'I'm Interested' on one of your listings via Find People."
            enabled={settings.notif_interest}
            onChange={(v) => patchSetting('notif_interest', v)}
            saving={saving}
          />
          <SettingRow
            label="Mutual matches (70%+ compatibility)"
            description="We'll email you when a seeker and your listing hit a 70%+ compatibility score — ideal for finding the right fit fast."
            enabled={settings.notif_mutual_match}
            onChange={(v) => patchSetting('notif_mutual_match', v)}
            saving={saving}
          />
        </div>

        <div className="mt-4 flex items-start gap-2 bg-navy-50 rounded-2xl px-4 py-3 border border-navy-100">
          <MdEmail size={15} className="text-navy-400 mt-0.5 shrink-0" />
          <p className="text-xs text-navy-500 leading-relaxed">
            Emails are sent to <span className="font-semibold text-navy-700">{user?.email}</span>.{' '}
            In-app notifications are always on regardless of these settings.
          </p>
        </div>
      </AccordionSection>

      {/* ── Danger Zone ────────────────────────────────────────────────────── */}
      <AccordionSection
        icon={MdWarning}
        title="Danger Zone"
        description="Permanent actions that cannot be undone."
        danger
      >
        {deleteStep === 0 && (
          <button
            type="button"
            onClick={() => setDeleteStep(1)}
            className="flex items-center gap-3 w-full text-left px-5 py-4 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
              <MdDeleteForever size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <div className="font-heading font-bold text-red-700 text-sm">Delete My Account</div>
              <div className="text-xs text-red-500 mt-0.5">Permanently remove your profile, listings, messages, and all data.</div>
            </div>
            <MdChevronRight size={20} className="text-red-400 shrink-0" />
          </button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm font-heading font-bold text-red-700 mb-2">Are you sure? This cannot be reversed.</p>
              <ul className="text-xs text-red-600 space-y-1.5 list-disc list-inside">
                <li>Your profile and all personal data will be erased</li>
                <li>All your property listings will be removed</li>
                <li>Your message history and buddy groups will be deleted</li>
                <li>Any active interests or matches will be cancelled</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteStep(0)} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-heading font-bold text-sm hover:bg-navy-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={() => setDeleteStep(2)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-heading font-bold text-sm hover:bg-red-700 transition-colors">
                Yes, continue
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              To confirm, type{' '}
              <span className="font-heading font-bold text-navy-950 bg-navy-50 px-1.5 py-0.5 rounded-lg">delete my account</span>{' '}
              below:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="delete my account"
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-navy-900 placeholder:text-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setDeleteStep(0); setDeleteInput(''); }} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-heading font-bold text-sm hover:bg-navy-50 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteInput.trim().toLowerCase() !== 'delete my account'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-heading font-bold text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Deleting...</>
                ) : (
                  <><MdDeleteForever size={16} />Delete Account</>
                )}
              </button>
            </div>
          </div>
        )}
      </AccordionSection>
    </div>
  );
}
