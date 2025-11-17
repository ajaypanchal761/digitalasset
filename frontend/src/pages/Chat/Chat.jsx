import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import "./Chat.css";

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "admin",
      text: "Fiqrih! How are you? It's been a long time since we last met.",
      timestamp: "10:50 PM",
    },
    {
      id: 2,
      sender: "user",
      text: "Oh, hi Admin! I have got a new job now and is going great. How about you?",
      timestamp: "1:06 AM",
    },
    {
      id: 3,
      sender: "admin",
      text: "I have been so busy with the new business that I have not had the time to do much else.",
      timestamp: "11:10 AM",
    },
    {
      id: 4,
      sender: "user",
      text: "What is that?",
      timestamp: "11:20 AM",
    },
    {
      id: 5,
      sender: "admin",
      text: "Small business, a coffee shop.",
      timestamp: "12:09 PM",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulate admin reply after 1 second
    setTimeout(() => {
      const adminReply = {
        id: messages.length + 2,
        sender: "admin",
        text: "Thank you for your message. I'll get back to you soon.",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
      setMessages((prev) => [...prev, adminReply]);
    }, 1000);
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
        <div className="chat-header__spacer"></div>
        <div className="chat-header__info">
          <h1 className="chat-header__name">Admin</h1>
          <p className="chat-header__status">Online</p>
        </div>
        <div className="chat-header__avatar">
          <div className="chat-header__avatar-circle">
            <span className="chat-header__avatar-initials">A</span>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.sender === "user" ? "chat-message--user" : "chat-message--admin"}`}
          >
            <div className={`chat-message__bubble ${message.sender === "user" ? "chat-message__bubble--user" : "chat-message__bubble--admin"}`}>
              <p className="chat-message__text">{message.text}</p>
            </div>
            <span className="chat-message__timestamp">{message.timestamp}</span>
          </div>
        ))}
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

