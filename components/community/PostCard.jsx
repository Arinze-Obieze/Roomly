'use client';

import { useState } from 'react';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdChatBubbleOutline, MdShare, MdReport, MdDelete } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { useAuthContext } from '@/contexts/AuthContext';
import CommentSection from './CommentSection';
import toast from 'react-hot-toast';

const CATEGORY_STYLES = {
  scam_alert: 'bg-red-100 text-red-700 border-red-200',
  event: 'bg-purple-100 text-purple-700 border-purple-200',
  tip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  news: 'bg-blue-100 text-blue-700 border-blue-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
};

const CATEGORY_LABELS = {
  scam_alert: '🚨 Scam Alert',
  event: '📅 Event',
  tip: '💡 Local Tip',
  news: '📰 News',
  general: '💬 General',
};

export default function PostCard({ post, onVote, onDelete }) {
  const { user } = useAuthContext();
  const [showComments, setShowComments] = useState(false);
  const [currentVote, setCurrentVote] = useState(post.user_vote);
  const [score, setScore] = useState(post.score);
  const [isVoting, setIsVoting] = useState(false);

  // Format tags
  const categoryStyle = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.general;
  const categoryLabel = CATEGORY_LABELS[post.category] || 'General';

  const handleVote = async (type) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }
    if (isVoting) return;

    // Optimistic update
    const previousVote = currentVote;
    const previousScore = score;
    
    // Toggle check
    let newVote = type;
    if (currentVote === type) newVote = 0; // Remove vote

    // Calculate score diff
    // e.g. was 0, now 1 (+1)
    // was 1, now 0 (-1)
    // was -1, now 1 (+2)
    const diff = newVote - previousVote;

    setCurrentVote(newVote);
    setScore(prev => prev + diff);
    setIsVoting(true);

    try {
      await onVote(post.id, newVote);
    } catch (error) {
      // Revert if failed
      setCurrentVote(previousVote);
      setScore(previousScore);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isOwner = user?.id === post.user_id;

  return (
    <div className={`bg-white rounded-2xl border p-4 sm:p-6 transition-all hover:shadow-md ${post.category === 'scam_alert' ? 'border-red-100 shadow-sm' : 'border-slate-200'}`}>
      <div className="flex gap-4">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-1 shrink-0 px-1">
          <button 
            onClick={() => handleVote(1)}
            className={`p-1 rounded hover:bg-slate-100 transition-colors ${currentVote === 1 ? 'text-cyan-600' : 'text-slate-400'}`}
          >
            <MdKeyboardArrowUp size={28} />
          </button>
          <span className={`font-bold text-sm ${currentVote !== 0 ? 'text-cyan-600' : 'text-slate-700'}`}>
            {score}
          </span>
          <button 
            onClick={() => handleVote(-1)}
            className={`p-1 rounded hover:bg-slate-100 transition-colors ${currentVote === -1 ? 'text-red-500' : 'text-slate-400'}`}
          >
            <MdKeyboardArrowDown size={28} />
          </button>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Header: Meta */}
          <div className="flex items-center gap-2 mb-2 flex-wrap text-xs sm:text-sm">
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${categoryStyle}`}>
              {categoryLabel}
            </span>
            <span className="text-slate-500">
              in <span className="font-semibold text-slate-700">{post.city}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              Posted by {post.author?.full_name?.split(' ')[0] || 'User'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Title & Body */}
          <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
            {post.title}
          </h3>
          <div className="text-slate-600 whitespace-pre-wrap mb-4 text-sm sm:text-base">
            {post.content}
          </div>

          {/* Image (Optional) */}
          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 max-h-96">
              <img src={post.image_url} alt="Post content" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-4">
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors text-sm font-medium"
              >
                <MdChatBubbleOutline size={18} />
                <span>{post.comments_count || 0} Comments</span>
              </button>
              <button className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors text-sm font-medium">
                <MdShare size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            <div className="flex gap-2">
               {isOwner && (
                <button 
                  onClick={() => onDelete(post.id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors text-xs font-medium"
                >
                  <MdDelete size={16} />
                  Delete
                </button>
              )}
              <button className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors text-xs font-medium">
                <MdReport size={16} />
                Report
              </button>
            </div>
          </div>

          {/* Comments Section (Collapsible) */}
          {showComments && (
            <div className="mt-6 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2">
              <CommentSection postId={post.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
