'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function CommentSection({ postId, onCommentAdded }) {
  const { user } = useAuthContext();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) throw new Error('Failed to post comment');
      
      const savedComment = await res.json();
      setComments(prev => [...prev, savedComment]);
      setNewComment('');
      if(onCommentAdded) onCommentAdded();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="text-center py-4 text-xs text-navy-400 font-sans">Loading discussion...</div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-navy-400 text-sm italic font-sans"
            >
              No comments yet. Be the first to share your thoughts!
            </motion.p>
          ) : (
            comments.map((comment, index) => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 text-sm"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta-600 font-heading font-bold text-xs overflow-hidden ring-2 ring-terracotta-500/20">
                  {comment.users?.profile_picture ? (
                    <img src={comment.users.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (comment.users?.full_name?.[0] || 'U')
                  )}
                </div>
                
                <div className="flex-1 bg-navy-50 p-3 rounded-lg rounded-tl-none border border-navy-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-bold text-navy-950 text-xs">
                      {comment.users?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-navy-400 font-sans">
                      {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <p className="text-navy-600 font-sans">{comment.content}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Write a comment..." : "Login to comment"}
          disabled={!user || isSubmitting}
          className="flex-1 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all text-sm font-sans placeholder-navy-400"
        />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!user || !newComment.trim() || isSubmitting}
          className="px-4 py-2 bg-terracotta-500 text-white rounded-xl font-heading font-medium text-sm hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-terracotta-500/20"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </motion.button>
      </form>
    </div>
  );
}