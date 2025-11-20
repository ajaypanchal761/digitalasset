import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../../services/api';
import { createSocket, getSocketToken } from '../../../utils/socket';
import './AdminChat.css';

const AdminChat = () => {
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
    const token = getSocketToken();
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
      const { chatId, message } = data;
      console.log('📨 Received message via socket:', { chatId, message });
      
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
            
            console.log('✅ Adding message to chat:', message);
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
      alert(error.message || 'An error occurred');
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
      console.log('📥 Fetching messages for user:', userId);
      const response = await adminAPI.getChatMessages(userId);
      console.log('📥 Messages response:', response);
      
      if (response.success && response.data) {
        const formattedMessages = (response.data.messages || []).map(msg => ({
          id: msg.id || msg._id,
          senderId: msg.senderId,
          senderType: msg.senderType,
          message: msg.message,
          isRead: msg.isRead,
          createdAt: msg.createdAt,
        }));
        
        console.log('📥 Formatted messages:', formattedMessages);
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
      alert('Please select a user to send a message');
      return;
    }
    
    if (sending) {
      console.warn('⚠️ Cannot send: Already sending');
      return;
    }
    
    // Check socket connection
    if (!socketRef.current) {
      console.error('❌ Cannot send: Socket not initialized');
      alert('Connection not ready. Please refresh the page.');
      return;
    }
    
    if (!socketRef.current.connected) {
      console.error('❌ Cannot send: Socket not connected');
      alert('Connection lost. Please refresh the page.');
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
          alert('Failed to get admin information. Please refresh the page.');
          return;
        }
      } catch (error) {
        console.error('❌ Failed to fetch admin ID:', error);
        alert('Failed to get admin information. Please refresh the page.');
        return;
      }
    }

    const messageText = inputMessage.trim();
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
    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('📤 Sending message via socket:', {
        message: messageText,
        userId: selectedUser.userId,
        adminId: currentAdminIdRef.current,
        socketId: socketRef.current.id,
      });
      
      // Send message via socket
      socketRef.current.emit('send-message', {
        message: messageText,
        userId: selectedUser.userId,
        adminId: currentAdminIdRef.current,
      });

      console.log('✅ Message emitted to socket');

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
      alert('Failed to send message. Please try again.');
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
                      <img src={conv.userAvatar} alt={conv.userName} />
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
                    <img src={selectedUser.userAvatar} alt={selectedUser.userName} />
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
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`admin-chat__message ${
                        message.senderType === 'Admin'
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
                  ))
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

