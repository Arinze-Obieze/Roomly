'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Filters
  const [category, setCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  const observer = useRef();

  // Debounce City Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCity(cityFilter);
      setPage(1); // Reset page on filter change
      setPosts([]); // Clear posts on filter change
    }, 500);
    return () => clearTimeout(timer);
  }, [cityFilter]);

  // Reset on category change
  useEffect(() => {
    setPage(1);
    setPosts([]);
  }, [category]);

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/community/posts?page=${page}&limit=10&category=${category}&city=${debouncedCity}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      
      const data = await res.json();
      
      setPosts(prev => {
        // If page 1, replace. Else append.
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

  // Infinite Scroll
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

  // Actions
  const handleVote = async (postId, voteType) => {
    // API Call handled by PostCard optimistic update, 
    // but we need to update local state logic if we want perfect consistency.
    // Actually PostCard manages its own "currentVote" state, 
    // so we just provide the API endpoint trigger here if needed 
    // OR PostCard can call API directly. 
    // Let's let PostCard call API directly, but we pass a wrapper to handle global errors if any.
    
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
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Community Forum</h1>
            <button 
                onClick={() => {
                    if (!user) toast.error('Please login to post');
                    else setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
                <MdAdd size={20} />
                <span>New Post</span>
            </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Filter by City (e.g. Dublin)" 
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setCategory(f.value)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            category === f.value 
                                ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post, index) => {
            if (posts.length === index + 1) {
                return (
                    <div ref={lastPostRef} key={post.id}>
                        <PostCard post={post} onVote={handleVote} onDelete={handleDelete} />
                    </div>
                );
            } else {
                return <PostCard key={post.id} post={post} onVote={handleVote} onDelete={handleDelete} />;
            }
        })}

        {loading && (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
            </div>
        )}

        {!loading && posts.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-medium">No posts found.</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to post something happening in {debouncedCity || 'your city'}!</p>
            </div>
        )}
        
        {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
                You've reached the end of the feed.
            </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePostModal 
            onClose={() => setShowCreateModal(false)} 
            onCreated={() => {
                setPage(1);
                fetchPosts(); // Refresh feed
            }} 
        />
      )}
    </div>
  );
}
