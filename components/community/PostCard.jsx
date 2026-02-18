'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdChatBubbleOutline, MdShare, MdReport, MdDelete, MdCheckCircle } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { useAuthContext } from '@/core/contexts/AuthContext';
import CommentSection from './CommentSection';
import toast from 'react-hot-toast';

const CATEGORY_STYLES = {
  scam_alert: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
  event: 'bg-teal-50 text-teal-700 border-teal-200',
  tip: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  news: 'bg-navy-50 text-navy-700 border-navy-200',
  general: 'bg-navy-50 text-navy-600 border-navy-200',
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

  const categoryStyle = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.general;
  const categoryLabel = CATEGORY_LABELS[post.category] || 'General';

  const handleVote = async (type) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }
    if (isVoting) return;

    const previousVote = currentVote;
    const previousScore = score;
    
    let newVote = type;
    if (currentVote === type) newVote = 0;

    const diff = newVote - previousVote;

    setCurrentVote(newVote);
    setScore(prev => prev + diff);
    setIsVoting(true);

    try {
      await onVote(post.id, newVote);
    } catch (error) {
      setCurrentVote(previousVote);
      setScore(previousScore);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isOwner = user?.id === post.user_id;

  return (
    <motion.div 
      layout
      className={`bg-white rounded-2xl border p-4 sm:p-6 transition-all hover:shadow-xl hover:shadow-navy-950/5 ${
        post.category === 'scam_alert' ? 'border-terracotta-200' : 'border-navy-200'
      }`}
    >
      <div className="flex gap-4">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-1 shrink-0 px-1">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(1)}
            className={`p-1 rounded hover:bg-navy-50 transition-colors ${
              currentVote === 1 ? 'text-terracotta-500' : 'text-navy-400'
            }`}
          >
            <MdKeyboardArrowUp size={28} />
          </motion.button>
          
          <motion.span 
            key={score}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`font-heading font-bold text-sm ${
              currentVote !== 0 ? 'text-terracotta-600' : 'text-navy-700'
            }`}
          >
            {score}
          </motion.span>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(-1)}
            className={`p-1 rounded hover:bg-navy-50 transition-colors ${
              currentVote === -1 ? 'text-terracotta-500' : 'text-navy-400'
            }`}
          >
            <MdKeyboardArrowDown size={28} />
          </motion.button>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Header: Meta */}
          <div className="flex items-center gap-2 mb-2 flex-wrap text-xs sm:text-sm">
            <span className={`px-2 py-0.5 rounded-full border text-xs font-heading font-medium ${categoryStyle}`}>
              {categoryLabel}
            </span>
            
            <span className="text-navy-500 font-sans">
              in <span className="font-heading font-bold text-navy-700">{post.city}</span>
            </span>
            
            <span className="text-navy-300">•</span>
            
            <span className="text-navy-500 font-sans">
              Posted by {post.author?.full_name?.split(' ')[0] || 'User'}
            </span>
            
            <span className="text-navy-300">•</span>
            
            <span className="text-navy-400 font-sans">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>

            {post.is_edited && (
              <>
                <span className="text-navy-300">•</span>
                <span className="text-navy-400 font-sans text-xs">edited</span>
              </>
            )}
          </div>

          {/* Title & Body */}
          <h3 className="text-xl font-heading font-bold text-navy-950 mb-2 leading-tight">
            {post.title}
          </h3>
          
          <div className="text-navy-600 whitespace-pre-wrap mb-4 text-sm sm:text-base font-sans">
            {post.content}
          </div>

          {/* Image (Optional) */}
          {post.image_url && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 rounded-xl overflow-hidden border border-navy-100 max-h-96"
            >
              <img src={post.image_url} alt="Post content" className="w-full h-full object-cover" />
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-navy-500 hover:text-terracotta-500 transition-colors text-sm font-heading font-medium"
              >
                <MdChatBubbleOutline size={18} />
                <span>{post.comments_count || 0} Comments</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 text-navy-500 hover:text-terracotta-500 transition-colors text-sm font-heading font-medium"
              >
                <MdShare size={18} />
                <span className="hidden sm:inline">Share</span>
              </motion.button>
            </div>

            <div className="flex gap-2">
              {isOwner && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(post.id)}
                  className="flex items-center gap-1 text-navy-400 hover:text-terracotta-500 transition-colors text-xs font-heading font-medium"
                >
                  <MdDelete size={16} />
                  Delete
                </motion.button>
              )}
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 text-navy-400 hover:text-terracotta-500 transition-colors text-xs font-heading font-medium"
              >
                <MdReport size={16} />
                Report
              </motion.button>
            </div>
          </div>

          {/* Comments Section (Collapsible) */}
          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 border-t border-navy-100 pt-4 overflow-hidden"
              >
                <CommentSection postId={post.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}