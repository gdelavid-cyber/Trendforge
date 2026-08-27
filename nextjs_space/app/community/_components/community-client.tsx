'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Trophy,
  Sparkles,
  Flame,
  Zap,
  DollarSign,
  ThumbsUp,
  Award,
  Send,
  Plus,
  Bot,
  CheckCircle2,
  Share2,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { SectionHelpBanner } from '@/components/guide/section-help-banner';

interface CommunityPostItem {
  id: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  createdAt: string;
  author: {
    name: string;
    role: string;
    communityPoints?: number;
  };
  commentsCount: number;
}

interface Favor {
  id: string;
  description: string;
  fromUser: string;
  task: string | null;
  creditValue: number;
}

interface Props {
  favors: Favor[];
  leaderboard: any[];
}

export function CommunityClient({ favors: initialFavors, leaderboard }: Props) {
  const [activeTab, setActiveTab] = useState('forums');
  const [forumCategory, setForumCategory] = useState('ALL');
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // New Post Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Favors state
  const [favors, setFavors] = useState<Favor[]>(initialFavors);
  const [favorDesc, setFavorDesc] = useState('');
  const [submittingFavor, setSubmittingFavor] = useState(false);
  const [consultPost, setConsultPost] = useState<CommunityPostItem | null>(null);
  const [isGeneralCompanionOpen, setIsGeneralCompanionOpen] = useState(false);

  // Daily Quests state
  const [questsCompleted, setQuestsCompleted] = useState<string[]>(['quest_login']);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/community/posts?category=${forumCategory}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (_) {}
    setLoadingPosts(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [forumCategory]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmittingPost(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          category: postCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Discussion posted! +10 Community Points earned.');
        setPostTitle('');
        setPostContent('');
        setShowPostModal(false);
        fetchPosts();
      } else {
        toast.error(data.error || 'Failed to post');
      }
    } catch {
      toast.error('Error creating post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/upvote`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, upvotes: data.upvotes } : p))
        );
        toast.success('Upvoted!');
      }
    } catch (_) {}
  };

  const handleOpenComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setPostComments(data.comments);
      }
    } catch (_) {}
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Comment added! +2 Community Points.');
        setCommentText('');
        // Refresh comments
        const cRes = await fetch(`/api/community/posts/${postId}/comments`);
        const cData = await cRes.json();
        if (cData.success) setPostComments(cData.comments);
        // Refresh post comment count
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
      }
    } catch {
      toast.error('Error posting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateFavor = async () => {
    if (!favorDesc.trim()) return;
    setSubmittingFavor(true);
    try {
      const res = await fetch('/api/favors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: favorDesc }),
      });
      if (res.ok) {
        toast.success('Favor posted!');
        setFavorDesc('');
        const listRes = await fetch('/api/favors');
        if (listRes.ok) {
          const data = await listRes.json();
          setFavors(
            data.favors.map((f: any) => ({
              id: f.id,
              description: f.description,
              fromUser: f.fromUser?.name ?? 'Anonymous',
              task: f.task?.title ?? null,
              creditValue: f.creditValue,
            }))
          );
        }
      } else {
        toast.error('Failed to post favor');
      }
    } catch {
      toast.error('Error posting favor');
    } finally {
      setSubmittingFavor(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10 font-sans">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>OPERATIVE NETWORK // PEER KNOWLEDGE EXCHANGE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white">
            Community <span className="cyan-gold-gradient-text">Hub</span>
          </h1>
          <p className="text-xs text-[#8892B0] font-sans mt-1">
            Exchange tactics, collaborate on Swarm agent recipes, complete daily quests, and share verified income proofs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsGeneralCompanionOpen(true)}
            className="border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/10 text-xs font-mono uppercase font-bold hover:bg-[#00F0FF]/20 shadow-[0_0_15px_rgba(0,240,255,0.2)] h-9 px-4"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5 text-[#00F0FF] animate-pulse" /> 🎙️ Ask AI Companion
          </Button>

          <Button
            onClick={() => setShowPostModal(true)}
            className="cyan-gradient text-black font-extrabold uppercase holographic-btn text-xs h-9 px-5"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Discussion
          </Button>
        </div>
      </motion.div>

      {/* Section Guide & Info */}
      <SectionHelpBanner />

      {/* Daily Quests Banner */}
      <div className="glass-card p-6 mb-8 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#FFD700] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD700]" /> Daily Operative Quests (Resets in 18h)
          </h3>
          <span className="text-[10px] font-mono text-[#00F0FF]">Earn Points to Unlock Swarm Runs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-white font-bold block">1. Daily Check-in</span>
              <span className="text-[10px] text-green-400 font-bold">+5 Points</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>

          <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-white font-bold block">2. Deploy 1 Swarm Agent</span>
              <span className="text-[10px] text-[#00F0FF] font-bold">+15 Points</span>
            </div>
            <span className="text-[10px] font-mono text-[#8892B0]">0/1</span>
          </div>

          <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-white font-bold block">3. Comment on Discussion</span>
              <span className="text-[10px] text-purple-400 font-bold">+10 Points</span>
            </div>
            <span className="text-[10px] font-mono text-[#8892B0]">0/1</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="forums" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-black/50 border border-white/10 p-1">
          <TabsTrigger value="forums" className="data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black text-xs font-mono font-bold">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Discussions ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black text-xs font-mono font-bold">
            <Trophy className="w-3.5 h-3.5 mr-1.5" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="favors" className="data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Peer Favors ({favors.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Discussion Forums */}
        <TabsContent value="forums" className="space-y-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['ALL', 'GENERAL', 'HELP', 'SUCCESS_STORIES', 'AGENT_IDEAS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setForumCategory(cat)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                  forumCategory === cat
                    ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/40 font-bold'
                    : 'bg-black/40 text-[#8892B0] border-white/5 hover:border-white/20'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Posts List */}
          {loadingPosts ? (
            <div className="py-16 text-center text-xs font-mono text-[#8892B0]">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00F0FF]" /> Loading discussions...
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card p-12 text-center text-xs font-mono text-[#8892B0]">
              No discussions found in this category. Be the first to start a conversation!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="glass-card p-6 border border-white/[0.08] hover:border-[#00F0FF]/20 transition-all">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-[#00F0FF] border border-white/5">
                      {post.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{post.title}</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpvote(post.id)}
                    className="border-white/10 text-xs font-mono hover:border-[#00F0FF]/40 h-7 px-2.5 flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3 h-3 text-[#00F0FF]" /> {post.upvotes}
                  </Button>
                </div>

                <p className="text-xs text-[#8892B0] font-sans leading-relaxed mb-4">{post.content}</p>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#8892B0] pt-3 border-t border-white/[0.04]">
                  <span>
                    By <strong className="text-white">{post.author.name}</strong> · {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setConsultPost(post)}
                      className="text-[#00F0FF] hover:text-white flex items-center gap-1 bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20"
                    >
                      <Bot className="w-3 h-3 text-[#00F0FF]" /> AI Analyze
                    </button>
                    <button
                      onClick={() => handleOpenComments(post.id)}
                      className="text-[#8892B0] hover:text-white flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> {post.commentsCount} Comments
                    </button>
                  </div>
                </div>

                {/* Expanded Comments Drawer */}
                {expandedPostId === post.id && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                    <div className="space-y-2">
                      {postComments.map((c: any) => (
                        <div key={c.id} className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#8892B0] mb-1">
                            <span className="text-white font-bold">{c.author}</span>
                            <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[#8892B0] font-sans">{c.content}</p>
                        </div>
                      ))}
                      {postComments.length === 0 && (
                        <div className="text-[11px] text-[#8892B0] font-mono">No comments yet.</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="bg-black/50 border-white/10 text-white text-xs h-8 font-sans"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment}
                        className="cyan-gradient text-black font-extrabold uppercase text-[10px] h-8 px-3"
                      >
                        {submittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Tab 2: Leaderboard */}
        <TabsContent value="leaderboard">
          <div className="glass-card p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[#FFD700] mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FFD700]" /> Top Operators
            </h3>
            <p className="text-[10px] text-[#8892B0] font-mono mb-3">Ranked by verified completed moves — income is private, never a leaderboard metric.</p>
            <div className="divide-y divide-white/[0.04] overflow-x-auto font-mono text-xs">
              {(leaderboard || []).slice(0, 20).map((u: any, idx: number) => (
                <div key={u.id || idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold ${idx < 3 ? 'text-[#FFD700]' : 'text-[#8892B0]'}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-white font-bold">{u.name || 'Anonymous Operative'}</span>
                  </div>
                  <span className="text-[#00F0FF] font-bold text-sm">
                    {(u.completedCount ?? 0).toLocaleString()} moves
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Favors */}
        <TabsContent value="favors">
          <div className="glass-card p-6 mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Request Peer Assistance</h3>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. Need code review on Stripe webhook handler or feedback on Reddit scraper prompt..."
                value={favorDesc}
                onChange={(e) => setFavorDesc(e.target.value)}
                className="bg-black/50 border-white/10 text-white text-xs h-9"
              />
              <Button onClick={handleCreateFavor} disabled={submittingFavor} className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-5 flex-shrink-0">
                Post Favor
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {favors.map((f) => (
              <div key={f.id} className="glass-card p-4 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white font-bold block">{f.description}</span>
                  <span className="text-[10px] text-[#8892B0]">Requested by {f.fromUser}</span>
                </div>
                <Button size="sm" variant="outline" className="border-white/10 text-xs h-7 text-[#00F0FF] hover:bg-[#00F0FF]/10">
                  Fulfill Favor
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Discussion Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0B14] border border-[#00F0FF]/30 rounded-xl max-w-lg w-full p-6 relative shadow-2xl"
            >
              <button onClick={() => setShowPostModal(false)} className="absolute top-4 right-4 text-[#8892B0] hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-white uppercase tracking-wider mb-1">Create Community Discussion</h3>
              <p className="text-xs text-[#8892B0] mb-4 font-sans">Share tactics, ask questions, or propose agent ideas.</p>

              <form onSubmit={handleCreatePost} className="space-y-4 font-sans">
                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Discussion Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white text-xs h-9 rounded px-2"
                  >
                    <option value="GENERAL">General Discussion</option>
                    <option value="HELP">Help & Technical Questions</option>
                    <option value="SUCCESS_STORIES">Success Stories & Income Proof</option>
                    <option value="AGENT_IDEAS">Agent Ideas & Swarm Recipes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Title</label>
                  <Input
                    placeholder="e.g. How I made $450 in 3 days with the Reddit Scraper"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="bg-black/50 border-white/10 text-white text-xs h-9"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Content</label>
                  <textarea
                    rows={4}
                    placeholder="Share your detailed insights or query..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white placeholder:text-[#8892B0] focus:outline-none focus:border-[#00F0FF]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowPostModal(false)} className="flex-1 border-white/10 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingPost} className="flex-1 cyan-gradient text-black font-extrabold uppercase text-xs">
                    {submittingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : 'Publish Discussion'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global AI Companion Community Consultation Modal */}
      <AgentCompanionModal
        isOpen={!!consultPost || isGeneralCompanionOpen}
        onClose={() => {
          setConsultPost(null);
          setIsGeneralCompanionOpen(false);
        }}
        agent={{
          name: 'Nexus Community Strategist',
          archetype: 'CYBER_HUMANOID',
          walletBalance: 0,
          survivalScore: 94,
        }}
        initialMessage={
          consultPost
            ? `I have synthesized the discussion "${consultPost.title}" posted in the ${consultPost.category} forum: "${consultPost.content.slice(0, 200)}...". How would you like me to formulate a tactical response or extract commercial signals from this thread?`
            : `Greetings Operative. I am scanning the live Community Hub orderbooks and strategy threads. How can I assist your research or knowledge synthesis today?`
        }
      />
    </div>
  );
}
