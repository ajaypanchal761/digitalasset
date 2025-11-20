import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { createSocket, getSocketToken } from "../../utils/socket.js";
import { chatAPI } from "../../services/api.js";
import "./Chat.css";

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const adminIdRef = useRef(null);

  const formatMessageTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Initialize socket and fetch messages
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initializeChat = async () => {
      try {
        // Fetch messages from API
        const messagesResponse = await chatAPI.getMessages();
        if (messagesResponse.success && messagesResponse.data) {
          const formattedMessages = messagesResponse.data.messages.map(msg => ({
            id: msg.id,
            sender: msg.senderType === 'User' ? 'user' : 'admin',
            text: msg.message,
            timestamp: formatMessageTime(msg.createdAt),
            createdAt: msg.createdAt,
            senderType: msg.senderType,
          }));
          setMessages(formattedMessages);
          
          // Store admin ID if available
          if (messagesResponse.data.admin?.id) {
            adminIdRef.current = messagesResponse.data.admin.id;
          }
        }

        // Initialize socket connection
        const token = getSocketToken();
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
              const { message } = data;
              const formattedMessage = {
                id: message.id,
                sender: message.senderType === 'User' ? 'user' : 'admin',
                text: message.message,
                timestamp: formatMessageTime(message.createdAt),
                createdAt: message.createdAt,
                senderType: message.senderType,
              };
              
              setMessages(prev => {
                // Check if message already exists
                const exists = prev.some(msg => 
                  msg.id === formattedMessage.id || 
                  (msg.id && msg.id.toString() === formattedMessage.id.toString())
                );
                if (exists) return prev;
                return [...prev, formattedMessage];
              });
            });

            // Listen for errors
            socket.on('error', (error) => {
              console.error('Socket error:', error);
            });
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prevent body scroll when chat page is mounted
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "" || sending || !socketRef.current) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    // Optimistically add message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: formatMessageTime(new Date()),
      createdAt: new Date(),
      senderType: 'User',
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Send message via socket
      if (socketRef.current && user?.id && adminIdRef.current) {
        socketRef.current.emit('send-message', {
          message: messageText,
          userId: user.id,
          adminId: adminIdRef.current,
        });

        // Remove temp message after a short delay (socket response should replace it)
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }, 1000);
      } else {
        // Fallback to API if socket is not available
        await chatAPI.sendMessage(messageText, adminIdRef.current);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
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
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.sender === "user" ? "chat-message--user" : "chat-message--admin"}`}
            >
              <div className={`chat-message__bubble ${message.sender === "user" ? "chat-message__bubble--user" : "chat-message__bubble--admin"}`}>
                <p className="chat-message__text">{message.text}</p>
              </div>
              <span className="chat-message__timestamp">{message.timestamp}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <footer className="chat-input-section">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <button type="button" className="chat-input__icon-btn chat-input__camera-btn" aria-label="Attach photo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a Message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={sending || loading}
          />
          <button type="button" className="chat-input__icon-btn chat-input__mic-btn" aria-label="Voice message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 10V12C19 16.4183 15.4183 20 11 20H13M5 10V12C5 16.4183 8.58172 20 13 20H11" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 20V23M8 23H16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;

