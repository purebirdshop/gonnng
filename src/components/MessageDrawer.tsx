import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, FeedPost, DirectMessage } from '../types';
import { isUserInCircle } from '../utils/followUtils';
import { dataService } from '../services/dataService';
import { getPublicMediaUrl } from '../services/uploadService';
import { X, Send, Users, ArrowUpRight, MessageSquare } from 'lucide-react';

interface MessageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerUser: Creator | null;
  currentUser: Creator;
  allCreators: Creator[];
  posts?: FeedPost[];
  onSelectPost?: (postId: string, origin?: string) => void;
  onSelectUser?: (userId: string) => void;
  initialSharedItem?: {
    text: string;
    postId?: string;
    postThumbnail?: string;
  };
}

export default function MessageDrawer({
  isOpen,
  onClose,
  partnerUser,
  currentUser,
  allCreators,
  posts = [],
  onSelectPost,
  onSelectUser,
  initialSharedItem
}: MessageDrawerProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inCircle = partnerUser ? isUserInCircle(currentUser, partnerUser.id, allCreators) : false;

  React.useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Load thread messages whenever drawer opens or partnerUser changes
  const loadThread = React.useCallback(async () => {
    if (!partnerUser || !currentUser) return;
    setLoading(true);
    try {
      const allMsgs = await dataService.getDirectMessages(currentUser.id);
      const threadMsgs = allMsgs.filter(m => 
        (m.senderId === currentUser.id && m.recipientId === partnerUser.id) ||
        (m.senderId === partnerUser.id && m.recipientId === currentUser.id)
      );
      setMessages(threadMsgs);
      await dataService.markDirectMessagesAsRead(currentUser.id, partnerUser.id);
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, partnerUser]);

  useEffect(() => {
    if (isOpen && partnerUser) {
      loadThread();
    }
  }, [isOpen, partnerUser, loadThread]);

  // Handle auto-send if initialSharedItem is passed (e.g., when sharing a profile/post/recipe directly)
  useEffect(() => {
    if (isOpen && partnerUser && currentUser && initialSharedItem) {
      const sendInitial = async () => {
        const text = initialSharedItem.text;
        if (!text) return;

        const newMsg = await dataService.sendDirectMessage(
          currentUser.id,
          partnerUser.id,
          text.slice(0, 1400),
          initialSharedItem.postThumbnail,
          initialSharedItem.postId,
          'accepted'
        );
        setMessages(prev => [...prev, newMsg]);
      };
      sendInitial();
    }
  }, [isOpen, partnerUser, currentUser, initialSharedItem]);

  // Scroll to bottom of message thread
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen || !partnerUser || !currentUser) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !currentUser) return;

    setSending(true);
    try {
      const text = inputText.trim().slice(0, 1400);
      setInputText('');

      const newMsg = await dataService.sendDirectMessage(
        currentUser.id,
        partnerUser.id,
        text,
        undefined,
        undefined,
        'accepted'
      );

      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const avatarUrl = partnerUser.avatarUrl
    ? getPublicMediaUrl('Gonnng', partnerUser.avatarUrl.trim())
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser.name)}&background=F59E0B&color=fff`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm cursor-pointer"
        />

        {/* Drawer container: Bottom-up on mobile (< sm), Right-side on tablet & above (>= sm) */}
        <motion.div
          initial={{ y: '100%', x: 0 }}
          animate={{ y: 0, x: 0 }}
          exit={{ y: '100%', x: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative z-50 w-full sm:w-96 border-t sm:border-t-0 sm:border-l p-4 sm:p-5 shadow-2xl flex flex-col justify-between max-h-[85vh] sm:max-h-none sm:h-full rounded-t-3xl sm:rounded-none bg-white border-gray-200 text-gray-900"
          id="message-drawer-container"
        >
          {/* Header */}
          <div className="space-y-3 pb-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div 
                onClick={() => {
                  if (onSelectUser) onSelectUser(partnerUser.id);
                  onClose();
                }}
                className="flex items-center gap-3 cursor-pointer group min-w-0"
              >
                <img
                  src={avatarUrl}
                  alt={partnerUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#F59E0B]/40 group-hover:border-[#F59E0B] transition-colors shrink-0 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser.name)}&background=F59E0B&color=fff`;
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold truncate text-gray-900 group-hover:text-[#F59E0B] transition-colors">
                      {partnerUser.name}
                    </h3>
                    {inCircle && (
                      <span className="text-[10px] font-mono font-bold bg-[#F59E0B]/15 text-[#F59E0B] px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Users className="w-2.5 h-2.5" /> Circle
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-gray-500 truncate">
                    @{partnerUser.username || partnerUser.name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-message-drawer-btn"
                onClick={onClose}
                className="p-1.5 rounded-full transition-all cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Thread Content Area */}
          <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 min-h-[220px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400 font-mono">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 bg-gray-50 rounded-2xl border border-gray-100 my-auto">
                <MessageSquare className="w-8 h-8 text-[#F59E0B] mx-auto opacity-80" />
                <h4 className="text-xs font-bold text-gray-800">
                  Start a conversation with {partnerUser.name}
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-xs mx-auto font-sans">
                  {inCircle
                    ? 'You are in each other\'s circle. Messages are delivered instantly.'
                    : 'You can send 1 message request to start a conversation.'}
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.senderId === currentUser.id;
                const isSharedPost = Boolean(m.postThumbnail || m.postId);
                const postObj = m.postId ? posts.find(p => p.id === m.postId) : null;
                const postTitle = postObj?.title || 'Shared Item';
                const postImage = postObj?.image || m.postThumbnail;

                return (
                  <div key={`drawer-msg-${m.id || idx}-${idx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {isSharedPost ? (
                      <div
                        onClick={() => {
                          if (m.postId && onSelectPost) {
                            onSelectPost(m.postId, 'message');
                            onClose();
                          }
                        }}
                        className={`w-full max-w-[85%] rounded-2xl p-3 border transition-all cursor-pointer group shadow-sm hover:border-[#F59E0B] ${
                          isMe
                            ? 'bg-orange-50/90 border-[#F59E0B]/40 text-gray-900'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        }`}
                      >
                        {postImage && (
                          <div className="w-full h-36 rounded-xl overflow-hidden mb-2 border border-gray-200 bg-gray-100 relative">
                            <img
                              src={postImage}
                              alt={postTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#F59E0B] border border-[#F59E0B]/30 uppercase">
                              Shared Item
                            </div>
                          </div>
                        )}
                        <h4 className="text-xs font-bold leading-snug mb-1 group-hover:text-[#F59E0B] transition-colors text-gray-900">
                          {postTitle}
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed mb-1">{m.text}</p>
                        <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pt-1 border-t border-gray-200/60">
                          <span className="text-[#F59E0B] font-bold flex items-center gap-0.5">
                            View Item <ArrowUpRight className="w-3 h-3" />
                          </span>
                          <span>{m.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                        isMe
                          ? 'bg-[#F59E0B] text-black font-medium rounded-br-none shadow-sm'
                          : 'bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-line">{m.text}</p>
                        <div className={`text-[9px] font-mono text-right ${isMe ? 'text-black/60' : 'text-gray-400'}`}>
                          {m.timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex flex-col gap-1 shrink-0">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={1400}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  placeholder={`Message @${partnerUser.username || partnerUser.name.toLowerCase().replace(/\s+/g, '')}...`}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[#F59E0B] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-400 pr-16"
                />
                {inputText.length > 0 && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono select-none pointer-events-none transition-colors ${
                    inputText.length >= 1350 ? 'text-amber-600 font-bold' : 'text-gray-400'
                  }`}>
                    {inputText.length}/1400
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#FF751A] disabled:opacity-40 text-black font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow shrink-0"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
