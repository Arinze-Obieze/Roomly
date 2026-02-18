'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdFilterList, MdSearch } from 'react-icons/md';
import { useAuthContext } from '@/core/contexts/AuthContext';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import toast from 'react-hot-toast';

const FILTERS = [
  { value: 'all', label: 'All Posts' },
  { value: 'scam_alert', label: '🚨 Scam Alerts' },
  { value: 'event', label: '📅 Events' },
  { value: 'tip', label: '💡 Tips' },
  { value: 'news', label: '📰 News' },
  { value: 'general', label: '💬 General' },
];

export default function CommunityFeed() {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [category, setCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  const observer = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCity(cityFilter);
      setPage(1);
      setPosts([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [cityFilter]);

  useEffect(() => {
    setPage(1);
    setPosts([]);
  }, [category]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/community/posts?page=${page}&limit=10&category=${category}&city=${debouncedCity}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      
      const data = await res.json();
      
      setPosts(prev => {
        return page === 1 ? data.posts : [...prev, ...data.posts];
      });
      setHasMore(data.hasMore);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedCity]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleVote = async (postId, voteType) => {
    await fetch(`/api/community/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote_type: voteType }),
    });
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header & Controls */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-8 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-navy-950">Community Forum</h1>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!user) toast.error('Please login to post');
              else setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl font-heading font-medium hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-500/20"
          >
            <MdAdd size={20} />
            <span>New Post</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-navy-200 space-y-4 shadow-xl shadow-navy-950/5">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
            <input 
              type="text" 
              placeholder="Filter by City (e.g. Dublin)" 
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-50 border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 font-sans placeholder-navy-400"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {FILTERS.map(f => (
              <motion.button
                key={f.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategory(f.value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-heading font-medium transition-all whitespace-nowrap ${
                  category === f.value 
                    ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20' 
                    : 'bg-navy-50 text-navy-600 border border-navy-200 hover:bg-navy-100'
                }`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feed */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <motion.div 
                  ref={lastPostRef} 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PostCard post={post} onVote={handleVote} onDelete={handleDelete} />
                </motion.div>
              );
            } else {
              return (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PostCard post={post} onVote={handleVote} onDelete={handleDelete} />
                </motion.div>
              );
            }
          })}
        </AnimatePresence>

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <div className="w-8 h-8 border-2 border-navy-200 border-t-terracotta-500 rounded-full animate-spin"></div>
          </motion.div>
        )}

        {!loading && posts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-white rounded-2xl border border-navy-200 border-dashed shadow-xl shadow-navy-950/5"
          >
            <div className="w-16 h-16 bg-terracotta-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdSearch className="text-terracotta-500" size={32} />
            </div>
            <p className="text-navy-950 font-heading font-bold mb-1">No posts found.</p>
            <p className="text-xs text-navy-500 font-sans">Be the first to post something happening in {debouncedCity || 'your city'}!</p>
          </motion.div>
        )}
        
        {!hasMore && posts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-xs text-navy-400 font-sans"
          >
            You've reached the end of the feed.
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal 
            onClose={() => setShowCreateModal(false)} 
            onCreated={() => {
              setPage(1);
              fetchPosts();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}