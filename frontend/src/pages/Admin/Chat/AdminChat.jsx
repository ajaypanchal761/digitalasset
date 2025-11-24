import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../../services/api';
import { useToast } from '../../../context/ToastContext.jsx';
import { createSocket, getAdminSocketToken } from '../../../utils/socket';
import './AdminChat.css';

const AdminChat = () => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const currentAdminIdRef = useRef(null);
  const selectedUserIdRef = useRef(null);

  // Initialize socket connection on mount
  useEffect(() => {
    const token = getAdminSocketToken();
    if (!token) {
      console.error('❌ No token found for socket connection');
      return;
    }

    const socket = createSocket(token);
    if (!socket) {
      console.error('❌ Failed to create socket');
      return;
    }

    socketRef.current = socket;

    // Get admin ID from token or fetch it
    const fetchAdminInfo = async () => {
      try {
        console.log('🔍 Fetching admin info...');
        const response = await adminAPI.getMe();
        console.log('📥 Admin info response:', response);
        if (response.success && response.user) {
          currentAdminIdRef.current = response.user.id || response.user._id;
          console.log('✅ Admin ID set:', currentAdminIdRef.current);
        } else {
          console.error('❌ Failed to get admin info from response:', response);
        }
      } catch (error) {
        console.error('❌ Failed to fetch admin info:', error);
      }
    };
    
    // Fetch admin info when socket connects
    socket.on('connect', () => {
      console.log('✅ Socket connected, fetching admin info...');
      fetchAdminInfo();
    });
    
    // Also fetch immediately in case socket is already connected
    if (socket.connected) {
      fetchAdminInfo();
    } else {
      // Fetch anyway, it will be used when socket connects
      fetchAdminInfo();
    }

    // Listen for incoming messages
    const handleReceiveMessage = (data) => {
      console.log('🟢 ADMIN CHAT - Socket message received (raw):', data);
      const { chatId, message } = data;
      
      console.log('🟢 ADMIN CHAT - Processing socket message:', {
        chatId,
        messageId: message.id || message._id,
        originalSenderType: message.senderType,
        senderTypeType: typeof message.senderType,
        senderId: message.senderId,
        text: message.message?.substring(0, 30),
        createdAt: message.createdAt,
        isAdmin: message.senderType === 'Admin',
        expectedSide: message.senderType === 'Admin' ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
      });
      
      // Always update conversation list when a message is received
      setConversations(prev =>
        prev.map(conv => {
          const convUserId = conv.userId?.toString() || conv.userId;
          const messageSenderId = message.senderId?.toString() || message.senderId;
          
          // Check if this message belongs to this conversation
          const messageBelongsToConv = 
            (message.senderType === 'User' && convUserId === messageSenderId) ||
            (message.senderType === 'Admin' && convUserId);
          
          if (messageBelongsToConv) {
            return {
              ...conv,
              lastMessage: message.message,
              lastMessageAt: message.createdAt,
              unreadCount: message.senderType === 'User' ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
            };
          }
          return conv;
        })
      );

      // Add message to current chat if it's for the selected user
      const currentSelectedUserId = selectedUserIdRef.current;
      if (currentSelectedUserId) {
        const selectedUserId = currentSelectedUserId.toString();
        const messageSenderId = message.senderId?.toString() || message.senderId;
        
        // Check if message belongs to current chat
        // User messages: senderId should match selectedUser.userId
        // Admin messages: should be shown if we're viewing this user's chat (any admin message in this chat)
        const belongsToCurrentChat = 
          (message.senderType === 'User' && messageSenderId === selectedUserId) ||
          (message.senderType === 'Admin');
        
        if (belongsToCurrentChat) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(msg => {
              const msgId = msg.id?.toString() || msg.id;
              const newMsgId = message.id?.toString() || message.id;
              return msgId === newMsgId;
            });
            if (exists) return prev;
            
            // Remove any temp messages with the same text (optimistic update replacement)
            const filtered = prev.filter(msg => {
              const isTemp = msg.id?.toString().startsWith('temp-');
              const sameText = msg.message === message.message;
              return !(isTemp && sameText && msg.senderType === message.senderType);
            });
            
            return [...filtered, message];
          });
        }
      }
    };
    
    socket.on('receive-message', handleReceiveMessage);

    // Listen for conversation updates
    socket.on('conversation-updated', (data) => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv.userId === data.userId);
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...data,
          };
          return updated;
        } else {
          // Add new conversation
          return [...prev, data];
        }
      });
    });

    // Listen for errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      showToast(error.message || 'An error occurred', 'error');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive-message', handleReceiveMessage);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages and join chat room when user is selected
  useEffect(() => {
    if (selectedUser && selectedUser.userId) {
      // Update ref for socket handler
      selectedUserIdRef.current = selectedUser.userId;
      
      // Always fetch messages first
      fetchMessages(selectedUser.userId);
      
      // Wait for admin ID and socket to be ready, then join room
      const joinChatRoom = () => {
        if (socketRef.current && currentAdminIdRef.current) {
          // Join chat room
          socketRef.current.emit('join-chat', {
            userId: selectedUser.userId,
            adminId: currentAdminIdRef.current,
          });

          // Mark messages as read
          socketRef.current.emit('mark-read', {
            userId: selectedUser.userId,
            adminId: currentAdminIdRef.current,
          });
        } else {
          // Retry after a short delay if admin ID not ready yet
          setTimeout(joinChatRoom, 100);
        }
      };
      
      joinChatRoom();
    } else {
      selectedUserIdRef.current = null;
    }
  }, [selectedUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getChatConversations();
      if (response.success) {
        setConversations(response.data || []);
        // Auto-select first conversation if available
        if (response.data && response.data.length > 0 && !selectedUser) {
          setSelectedUser(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      console.log('🟢 ADMIN CHAT - Fetching messages for user:', userId);
      const response = await adminAPI.getChatMessages(userId);
      
      console.log('🟢 ADMIN CHAT - API Response:', {
        success: response.success,
        hasData: !!response.data,
        messageCount: response.data?.messages?.length || 0,
        rawResponse: response,
      });
      
      if (response.success && response.data) {
        console.log('🟢 ADMIN CHAT - Raw messages from API:', response.data.messages);
        
        const formattedMessages = (response.data.messages || []).map((msg, index) => {
          console.log(`🟢 ADMIN CHAT - Message ${index + 1} formatting:`, {
            id: msg.id || msg._id,
            originalSenderType: msg.senderType,
            senderTypeType: typeof msg.senderType,
            senderId: msg.senderId,
            text: msg.message?.substring(0, 30),
            isAdmin: msg.senderType === 'Admin',
            expectedSide: msg.senderType === 'Admin' ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
          });
          
          return {
            id: msg.id || msg._id,
            senderId: msg.senderId,
            senderType: msg.senderType,
            message: msg.message,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
          };
        });
        
        console.log('🟢 ADMIN CHAT - Formatted messages ready to display:', formattedMessages);
        setMessages(formattedMessages);
        
        // Update conversation unread count after fetching
        setConversations(prev =>
          prev.map(conv =>
            conv.userId === userId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } else {
        console.warn('⚠️ No messages in response or response not successful');
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log('🔍 Send button clicked:', {
      hasMessage: !!inputMessage.trim(),
      hasSelectedUser: !!selectedUser,
      isSending: sending,
      hasSocket: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      socketId: socketRef.current?.id,
      hasAdminId: !!currentAdminIdRef.current,
      adminId: currentAdminIdRef.current,
    });
    
    // Validate input
    if (!inputMessage.trim()) {
      console.warn('⚠️ Cannot send: No message text');
      return;
    }
    
    if (!selectedUser) {
      console.warn('⚠️ Cannot send: No user selected');
      showToast('Please select a user to send a message', 'warning');
      return;
    }
    
    if (sending) {
      console.warn('⚠️ Cannot send: Already sending');
      return;
    }
    
    // Check socket connection
    if (!socketRef.current) {
      console.error('❌ Cannot send: Socket not initialized');
      showToast('Connection not ready. Please refresh the page.', 'warning');
      return;
    }
    
    if (!socketRef.current.connected) {
      console.error('❌ Cannot send: Socket not connected');
      showToast('Connection lost. Please refresh the page.', 'error');
      return;
    }
    
    // Check admin ID
    if (!currentAdminIdRef.current) {
      console.warn('⚠️ Admin ID not set, fetching...');
      try {
        const response = await adminAPI.getMe();
        if (response.success && response.user) {
          currentAdminIdRef.current = response.user.id || response.user._id;
          console.log('✅ Admin ID fetched:', currentAdminIdRef.current);
        } else {
          console.error('❌ Failed to get admin info from response:', response);
          showToast('Failed to get admin information. Please refresh the page.', 'error');
          return;
        }
      } catch (error) {
        console.error('❌ Failed to fetch admin ID:', error);
        alert('Failed to get admin information. Please refresh the page.');
        return;
      }
    }

    const messageText = inputMessage.trim();
    console.log('🟢 ADMIN CHAT - Sending message:', {
      text: messageText,
      adminId: currentAdminIdRef.current,
      userId: selectedUser?.userId,
      hasSocket: !!socketRef.current,
    });
    
    setInputMessage('');
    setSending(true);

    // Optimistically add message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentAdminIdRef.current,
      senderType: 'Admin',
      message: messageText,
      isRead: false,
      createdAt: new Date(),
    };
    
    console.log('🟢 ADMIN CHAT - Temp message created:', tempMessage);
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Send message via socket
      if (socketRef.current && selectedUser?.userId) {
        console.log('🟢 ADMIN CHAT - Emitting message via socket:', {
          message: messageText,
          userId: selectedUser.userId,
          adminId: currentAdminIdRef.current,
          socketId: socketRef.current.id,
        });
        
        socketRef.current.emit('send-message', {
          message: messageText,
          userId: selectedUser.userId,
          adminId: currentAdminIdRef.current,
        });
        
        console.log('🟢 ADMIN CHAT - Message emitted to socket');
      } else {
        console.error('🟢 ADMIN CHAT - Cannot send: Missing socket or userId', {
          hasSocket: !!socketRef.current,
          userId: selectedUser?.userId,
        });
      }

      // The socket will emit 'receive-message' which will update the UI
      // The real message from socket will replace the temp message
      
      // Update conversation last message optimistically
      setConversations(prev =>
        prev.map(conv =>
          conv.userId === selectedUser.userId
            ? {
                ...conv,
                lastMessage: messageText,
                lastMessageAt: new Date(),
              }
            : conv
        )
      );

      // Remove temp message after socket response (real message will have different ID)
      // Keep it for up to 5 seconds, then remove if real message hasn't arrived
      setTimeout(() => {
        setMessages(prev => {
          // Only remove if it's still a temp message (starts with 'temp-')
          const tempMsg = prev.find(msg => msg.id === tempMessage.id);
          if (tempMsg && tempMsg.id.toString().startsWith('temp-')) {
            console.warn('⚠️ Temp message not replaced after 5 seconds, removing');
            return prev.filter(msg => msg.id !== tempMessage.id);
          }
          return prev;
        });
      }, 5000);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatMessageTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="admin-chat">
        <div className="admin-chat__loading">
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chat">
      <div className="admin-chat__container">
        {/* Sidebar - User List */}
        <aside className="admin-chat__sidebar">
          <div className="admin-chat__sidebar-header">
            <h2 className="admin-chat__sidebar-title">Conversations</h2>
            <button
              className="admin-chat__refresh-btn"
              onClick={fetchConversations}
              title="Refresh"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8V12L15 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="admin-chat__user-list">
            {conversations.length === 0 ? (
              <div className="admin-chat__empty">
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.userId}
                  className={`admin-chat__user-item ${
                    selectedUser?.userId === conv.userId ? 'admin-chat__user-item--active' : ''
                  }`}
                  onClick={() => setSelectedUser(conv)}
                >
                  <div className="admin-chat__user-avatar">
                    {conv.userAvatar ? (
                      <img 
                        src={conv.userAvatar} 
                        alt={conv.userName}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span>{getUserInitials(conv.userName)}</span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="admin-chat__unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                  <div className="admin-chat__user-info">
                    <div className="admin-chat__user-name">{conv.userName}</div>
                    <div className="admin-chat__user-preview">
                      {conv.lastMessage}
                    </div>
                    <div className="admin-chat__user-time">{formatTime(conv.lastMessageAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="admin-chat__main">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <header className="admin-chat__header">
                <div className="admin-chat__header-avatar">
                  {selectedUser.userAvatar ? (
                    <img 
                      src={selectedUser.userAvatar} 
                      alt={selectedUser.userName}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span>{getUserInitials(selectedUser.userName)}</span>
                  )}
                </div>
                <div className="admin-chat__header-info">
                  <h3 className="admin-chat__header-name">{selectedUser.userName}</h3>
                  <p className="admin-chat__header-email">{selectedUser.userEmail}</p>
                </div>
              </header>

              {/* Messages */}
              <div className="admin-chat__messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                  <div className="admin-chat__no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // WhatsApp-like behavior for ADMIN chat:
                    // - senderType === 'Admin' → Message sent by current admin → Right side (blue) = SENT
                    // - senderType === 'User' → Message received from user → Left side (grey) = RECEIVED
                    const senderType = String(message.senderType || '').trim();
                    const isAdminMessage = senderType === 'Admin';
                    
                    if (index < 3 || messages.length - index <= 3) {
                      console.log(`🟢 ADMIN CHAT - Rendering message ${index + 1}/${messages.length}:`, {
                        id: message.id,
                        originalSenderType: message.senderType,
                        normalizedSenderType: senderType,
                        senderTypeType: typeof message.senderType,
                        isAdminMessage,
                        expectedSide: isAdminMessage ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
                        className: isAdminMessage ? 'admin-chat__message--admin' : 'admin-chat__message--user',
                        text: message.message?.substring(0, 30),
                        comparison: `"${senderType}" === "Admin" = ${senderType === 'Admin'}`,
                      });
                    }
                    
                    return (
                      <div
                        key={message.id}
                        className={`admin-chat__message ${
                          isAdminMessage
                            ? 'admin-chat__message--admin'
                            : 'admin-chat__message--user'
                        }`}
                      >
                        <div className="admin-chat__message-bubble">
                          <p className="admin-chat__message-text">{message.message}</p>
                          <span className="admin-chat__message-time">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <footer className="admin-chat__input-section">
                <form className="admin-chat__input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="admin-chat__input"
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="admin-chat__send-btn"
                    disabled={!inputMessage.trim() || sending || !socketRef.current?.connected || !currentAdminIdRef.current}
                    title={
                      !socketRef.current?.connected 
                        ? 'Connecting...' 
                        : !currentAdminIdRef.current 
                        ? 'Loading admin info...' 
                        : sending
                        ? 'Sending...'
                        : 'Send message'
                    }
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="admin-chat__no-selection">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminChat;

