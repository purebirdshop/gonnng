import { Router, type Request, type Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Helper to resolve all database identifiers for a user
  async function getUserIdentifiers(identifier: string): Promise<string[]> {
    const ids = new Set<string>([identifier]);
    if (supabase && identifier) {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, public_id, username')
          .or(`id.eq.${identifier},public_id.eq.${identifier},username.eq.${identifier}`);
        if (data && data.length > 0) {
          data.forEach(u => {
            if (u.id) ids.add(u.id);
            if (u.public_id) ids.add(u.public_id);
            if (u.username) ids.add(u.username);
          });
        }
      } catch (e) {
        // Fallback
      }
    }
    return Array.from(ids);
  }

// GET /api/messages/:userId - Fetch all direct messages involving userId
router.get('/api/messages/:userId', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const identifiers = await getUserIdentifiers(userId);

      if (supabase) {
        const idListStr = identifiers.map(i => `"${i}"`).join(',');
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.in.(${idListStr}),recipient_id.in.(${idListStr})`)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const formatted = data.map(row => {
            const createdAt = new Date(row.created_at).getTime();
            const diffSec = Math.floor((Date.now() - createdAt) / 1000);
            let timestamp = 'Just now';
            if (diffSec >= 60 && diffSec < 3600) timestamp = `${Math.floor(diffSec / 60)}m ago`;
            else if (diffSec >= 3600 && diffSec < 86400) timestamp = `${Math.floor(diffSec / 3600)}h ago`;
            else if (diffSec >= 86400) timestamp = `${Math.floor(diffSec / 86400)}d ago`;

            return {
              id: row.id,
              senderId: row.sender_id,
              recipientId: row.recipient_id,
              text: row.text,
              isRead: Boolean(row.is_read),
              status: row.status || 'accepted',
              postThumbnail: row.post_thumbnail || undefined,
              postId: row.post_id || undefined,
              createdAt,
              timestamp
            };
          });

          return res.json({ success: true, messages: formatted });
        }
      }

      return res.json({ success: true, messages: [] });
    } catch (err: any) {
      console.error('Fetch direct messages error:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
    }
  });

// POST /api/messages - Send a new direct message
router.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const { senderId, recipientId, text, postThumbnail, postId, status = 'accepted' } = req.body;
      if (!senderId || !recipientId || !text || !String(text).trim()) {
        return res.status(400).json({ success: false, error: 'senderId, recipientId, and text are required.' });
      }

      const trimmedText = String(text).trim().slice(0, 1400);
      const createdAt = Date.now();

      if (supabase) {
        // Try inserting with status column
        let insertObj: any = {
          sender_id: senderId,
          recipient_id: recipientId,
          text: trimmedText,
          is_read: true,
          status,
          post_thumbnail: postThumbnail || null,
          post_id: postId || null
        };

        let { data, error } = await supabase
          .from('direct_messages')
          .insert(insertObj)
          .select('*')
          .single();

        // If status column is missing on server table, retry without status column
        if (error && (error.code === 'PGRST204' || error.message?.includes('status'))) {
          delete insertObj.status;
          const retryRes = await supabase
            .from('direct_messages')
            .insert(insertObj)
            .select('*')
            .single();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (!error && data) {
          const msgObj = {
            id: data.id,
            senderId: data.sender_id,
            recipientId: data.recipient_id,
            text: data.text,
            isRead: Boolean(data.is_read),
            status: data.status || status,
            postThumbnail: data.post_thumbnail || undefined,
            postId: data.post_id || undefined,
            timestamp: 'Just now',
            createdAt
          };
          return res.json({ success: true, message: msgObj });
        } else if (error) {
          console.error('Supabase direct message insert error:', error);
        }
      }

      // Fallback message object if database was unconfigured
      const fallbackMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId,
        recipientId,
        text: String(text).trim(),
        isRead: true,
        status,
        postThumbnail,
        postId,
        timestamp: 'Just now',
        createdAt
      };

      return res.json({ success: true, message: fallbackMsg });
    } catch (err: any) {
      console.error('Send message error:', err);
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  });

// PUT /api/messages/read - Mark messages as read
router.put('/api/messages/read', async (req: Request, res: Response) => {
    try {
      const { currentUserId, partnerId } = req.body;
      if (supabase && currentUserId && partnerId) {
        const myIds = await getUserIdentifiers(currentUserId);
        const partnerIds = await getUserIdentifiers(partnerId);

        const myIdsStr = myIds.map(i => `"${i}"`).join(',');
        const partnerIdsStr = partnerIds.map(i => `"${i}"`).join(',');

        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .or(`and(recipient_id.in.(${myIdsStr}),sender_id.in.(${partnerIdsStr}))`);
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Mark messages read error:', err);
      return res.json({ success: true });
    }
  });

// PUT /api/messages/accept - Accept message request
router.put('/api/messages/accept', async (req: Request, res: Response) => {
    try {
      const { currentUserId, partnerId } = req.body;
      if (supabase && currentUserId && partnerId) {
        const myIds = await getUserIdentifiers(currentUserId);
        const partnerIds = await getUserIdentifiers(partnerId);

        const myIdsStr = myIds.map(i => `"${i}"`).join(',');
        const partnerIdsStr = partnerIds.map(i => `"${i}"`).join(',');

        try {
          await supabase
            .from('direct_messages')
            .update({ status: 'accepted' })
            .or(`and(sender_id.in.(${myIdsStr}),recipient_id.in.(${partnerIdsStr})),and(sender_id.in.(${partnerIdsStr}),recipient_id.in.(${myIdsStr}))`);
        } catch (e) {
          // Ignores if status column missing
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Accept message request error:', err);
      return res.json({ success: true });
    }
  });

// PUT /api/messages/decline - Decline/Delete message request
router.put('/api/messages/decline', async (req: Request, res: Response) => {
    try {
      const { currentUserId, partnerId } = req.body;
      if (supabase && currentUserId && partnerId) {
        const myIds = await getUserIdentifiers(currentUserId);
        const partnerIds = await getUserIdentifiers(partnerId);

        const myIdsStr = myIds.map(i => `"${i}"`).join(',');
        const partnerIdsStr = partnerIds.map(i => `"${i}"`).join(',');

        try {
          await supabase
            .from('direct_messages')
            .delete()
            .or(`and(sender_id.in.(${myIdsStr}),recipient_id.in.(${partnerIdsStr})),and(sender_id.in.(${partnerIdsStr}),recipient_id.in.(${myIdsStr}))`);
        } catch (e) {
          // Ignores error
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Decline message request error:', err);
      return res.json({ success: true });
    }
  });

export default router;
