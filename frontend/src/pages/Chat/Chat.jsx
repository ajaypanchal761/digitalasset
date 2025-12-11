import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { createSocket, getUserSocketToken } from "../../utils/socket.js";
import { chatAPI } from "../../services/api.js";
import logger from "../../utils/logger.js";
import "./Chat.css";

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const adminIdRef = useRef(null);

  const formatMessageTime = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Initialize socket and fetch messages
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initializeChat = async () => {
      try {
        // Fetch messages from API
        console.log('🔵 USER CHAT - Fetching messages from API...');
        const messagesResponse = await chatAPI.getMessages();
        console.log('🔵 USER CHAT - API Response:', {
          success: messagesResponse.success,
          hasData: !!messagesResponse.data,
          messageCount: messagesResponse.data?.messages?.length || 0,
          rawResponse: messagesResponse,
        });
        
        if (messagesResponse.success && messagesResponse.data) {
          console.log('🔵 USER CHAT - Raw messages from API:', messagesResponse.data.messages);
          
          const formattedMessages = messagesResponse.data.messages.map((msg, index) => {
            // WhatsApp-like: senderType === 'User' means message sent by current user (right/blue)
            const senderType = String(msg.senderType || '').trim();
            const isFromUser = senderType === 'User';
            
            console.log(`🔵 USER CHAT - Message ${index + 1} formatting:`, {
              id: msg.id || msg._id,
              originalSenderType: msg.senderType,
              normalizedSenderType: senderType,
              senderTypeType: typeof msg.senderType,
              isFromUser,
              expectedSide: isFromUser ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
              text: msg.message?.substring(0, 30),
              senderId: msg.senderId,
            });
            
            return {
              id: msg.id || msg._id,
              sender: isFromUser ? 'user' : 'admin',
              text: msg.message,
              timestamp: formatMessageTime(msg.createdAt),
              createdAt: msg.createdAt,
              senderType: msg.senderType, // Keep original for reference
              senderId: msg.senderId,
            };
          });
          
          // Sort messages by creation time (oldest first)
          formattedMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA - timeB;
          });
          
          console.log('🔵 USER CHAT - Formatted messages ready to display:', formattedMessages);
          setMessages(formattedMessages);
          
          // Store admin ID if available
          if (messagesResponse.data.admin?.id) {
            adminIdRef.current = messagesResponse.data.admin.id;
          }
        }

        // Initialize socket connection - use user token specifically
        const token = getUserSocketToken();
        if (token) {
          const socket = createSocket(token);
          if (socket) {
            socketRef.current = socket;

            // Get admin ID from conversation if not already set
            const convResponse = await chatAPI.getConversations();
            if (convResponse.success && convResponse.data?.adminId) {
              adminIdRef.current = convResponse.data.adminId;
            }

            // Join chat room if admin ID is available
            if (adminIdRef.current && user.id) {
              socket.emit('join-chat', {
                userId: user.id,
                adminId: adminIdRef.current,
              });
            }

            // Listen for incoming messages
            socket.on('receive-message', (data) => {
              console.log('🔵 USER CHAT - Socket message received (raw):', data);
              const { message } = data;
              
              console.log('🔵 USER CHAT - Processing socket message:', {
                id: message.id || message._id,
                originalSenderType: message.senderType,
                senderTypeType: typeof message.senderType,
                senderId: message.senderId,
                text: message.message?.substring(0, 30),
                createdAt: message.createdAt,
              });
              
              // WhatsApp-like: senderType === 'User' means message sent by current user (right/blue)
              const senderType = String(message.senderType || '').trim();
              const isFromUser = senderType === 'User';
              
              console.log('🔵 USER CHAT - Message classification:', {
                normalizedSenderType: senderType,
                isFromUser,
                expectedSide: isFromUser ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
                comparison: `"${senderType}" === "User" = ${senderType === 'User'}`,
              });
              
              const formattedMessage = {
                id: message.id || message._id,
                sender: isFromUser ? 'user' : 'admin',
                text: message.message,
                timestamp: formatMessageTime(message.createdAt),
                createdAt: message.createdAt,
                senderType: message.senderType, // Keep original
                senderId: message.senderId,
              };
              
              console.log('🔵 USER CHAT - Formatted message:', formattedMessage);
              
              setMessages(prev => {
                // Check if message already exists (by ID or by content + time to avoid duplicates)
                const exists = prev.some(msg => {
                  if (msg.id && formattedMessage.id) {
                    return msg.id.toString() === formattedMessage.id.toString();
                  }
                  // Also check by content and time if IDs don't match
                  return msg.text === formattedMessage.text && 
                         Math.abs(new Date(msg.createdAt).getTime() - new Date(formattedMessage.createdAt).getTime()) < 1000;
                });
                if (exists) {
                  return prev;
                }
                
                // Remove any temp messages with same content
                const filtered = prev.filter(msg => {
                  if (msg.id && msg.id.toString().startsWith('temp-')) {
                    // Remove temp message if real message is arriving
                    return msg.text !== formattedMessage.text;
                  }
                  return true;
                });
                
                // Add new message and sort by time
                const updated = [...filtered, formattedMessage];
                updated.sort((a, b) => {
                  const timeA = new Date(a.createdAt).getTime();
                  const timeB = new Date(b.createdAt).getTime();
                  return timeA - timeB;
                });
                return updated;
              });
            });

            // Listen for errors
            socket.on('error', (error) => {
              logger.error('Socket error:', error);
            });
          }
        }
      } catch (error) {
        logger.error('Failed to initialize chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Don't prevent body scroll - let the page scroll naturally to prevent overlap

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "" || sending || !socketRef.current) return;

    const messageText = inputMessage.trim();
    console.log('🔵 USER CHAT - Sending message:', {
      text: messageText,
      userId: user.id || user._id,
      adminId: adminIdRef.current,
      hasSocket: !!socketRef.current,
    });
    
    setInputMessage("");
    setSending(true);

    // Optimistically add message (always from user since user is sending)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: formatMessageTime(new Date()),
      createdAt: new Date(),
      senderType: 'User',
      senderId: user.id || user._id,
    };
    
    console.log('🔵 USER CHAT - Temp message created:', tempMessage);
    
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Send message via socket
      if (socketRef.current && user?.id && adminIdRef.current) {
        console.log('🔵 USER CHAT - Emitting message via socket:', {
          message: messageText,
          userId: user.id,
          adminId: adminIdRef.current,
          socketId: socketRef.current.id,
        });
        
        socketRef.current.emit('send-message', {
          message: messageText,
          userId: user.id,
          adminId: adminIdRef.current,
        });
        
        console.log('🔵 USER CHAT - Message emitted to socket');

        // Remove temp message after socket confirms (the receive-message event will add the real one)
        // Use a longer timeout to ensure socket message arrives first
        setTimeout(() => {
          setMessages(prev => {
            // Only remove temp if we haven't received the real message yet
            const hasRealMessage = prev.some(msg => 
              msg.text === messageText && 
              msg.id && 
              !msg.id.toString().startsWith('temp-') &&
              Math.abs(new Date(msg.createdAt).getTime() - new Date(tempMessage.createdAt).getTime()) < 5000
            );
            
            if (hasRealMessage) {
              // Real message arrived, remove temp
              return prev.filter(msg => msg.id !== tempMessage.id);
            }
            // Keep temp for now, will be removed when real message arrives
            return prev;
          });
        }, 2000);
      } else {
        // Fallback to API if socket is not available
        await chatAPI.sendMessage(messageText, adminIdRef.current);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <button 
            type="button" 
            className="chat-header__back-btn" 
            onClick={() => navigate("/dashboard")}
            aria-label="Go back to home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19L5 12L12 5" />
            </svg>
          </button>
          <div className="chat-header__avatar">
            <div className="chat-header__avatar-circle">
              <span className="chat-header__avatar-initials">A</span>
            </div>
          </div>
          <div className="chat-header__info">
            <h1 className="chat-header__name">Admin</h1>
            <p className="chat-header__status">Online</p>
          </div>
          <div className="chat-header__spacer"></div>
        </header>

        {/* Messages Container */}
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              // WhatsApp-like behavior for USER chat:
              // - senderType === 'User' → Message sent by current user → Right side (blue) = SENT
              // - senderType === 'Admin' → Message received from admin → Left side (grey) = RECEIVED
              const senderType = String(message.senderType || '').trim();
              const isUserMessage = senderType === 'User';
              
              if (index < 3 || messages.length - index <= 3) {
                console.log(`🔵 USER CHAT - Rendering message ${index + 1}/${messages.length}:`, {
                  id: message.id,
                  originalSenderType: message.senderType,
                  normalizedSenderType: senderType,
                  senderTypeType: typeof message.senderType,
                  isUserMessage,
                  expectedSide: isUserMessage ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
                  className: isUserMessage ? 'chat-message--user' : 'chat-message--admin',
                  bubbleClass: isUserMessage ? 'chat-message__bubble--user' : 'chat-message__bubble--admin',
                  text: message.text?.substring(0, 30),
                  comparison: `"${senderType}" === "User" = ${senderType === 'User'}`,
                });
              }
              
              return (
                <div
                  key={message.id || `msg-${message.createdAt}-${Math.random()}`}
                  className={`chat-message ${isUserMessage ? "chat-message--user" : "chat-message--admin"}`}
                >
                  <div className={`chat-message__bubble ${isUserMessage ? "chat-message__bubble--user" : "chat-message__bubble--admin"}`}>
                    <p className="chat-message__text">{message.text}</p>
                  </div>
                  <span className="chat-message__timestamp">{message.timestamp}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <footer className="chat-input-section">
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type a Message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sending || loading}
            />
            <button 
              type="submit" 
              className="chat-input__send-btn" 
              aria-label="Send message"
              disabled={sending || loading || !inputMessage.trim()}
            >
              {sending ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-input__send-spinner">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default Chat;

