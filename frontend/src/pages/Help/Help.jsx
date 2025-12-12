import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  KYCIcon,
  InvestmentIcon,
  WalletIcon,
  WithdrawalIcon,
  AccountIcon,
  TechnicalIcon,
  GettingStartedIcon,
  HelpIcon,
  SupportIcon,
} from "../../components/HelpIcons.jsx";
import { helpArticleAPI } from "../../services/api";
import "./Help.css";

// Icon mapping for articles
const getArticleIcon = (category) => {
  const iconProps = { size: 32, color: "#3b82f6" };
  switch (category) {
    case "KYC":
      return <KYCIcon {...iconProps} />;
    case "Investment":
      return <InvestmentIcon {...iconProps} />;
    case "Wallet":
      return <WalletIcon {...iconProps} />;
    case "Withdrawal":
      return <WithdrawalIcon {...iconProps} />;
    case "Account":
      return <AccountIcon {...iconProps} />;
    case "Technical":
      return <TechnicalIcon {...iconProps} />;
    default:
      return <HelpIcon {...iconProps} />;
  }
};

// Icon mapping for categories
const getCategoryIcon = (id) => {
  const iconProps = { size: 32, color: "currentColor" };
  switch (id) {
    case "getting-started":
      return <GettingStartedIcon {...iconProps} />;
    case "kyc":
      return <KYCIcon {...iconProps} />;
    case "investment":
      return <InvestmentIcon {...iconProps} />;
    case "wallet":
      return <WalletIcon {...iconProps} />;
    case "withdrawal":
      return <WithdrawalIcon {...iconProps} />;
    case "account":
      return <AccountIcon {...iconProps} />;
    default:
      return <HelpIcon {...iconProps} />;
  }
};

const categories = [
  { id: "getting-started", name: "Getting Started", iconComponent: "getting-started", color: "#3b82f6" },
  { id: "kyc", name: "KYC Verification", iconComponent: "kyc", color: "#10b981" },
  { id: "investment", name: "Investments", iconComponent: "investment", color: "#f59e0b" },
  { id: "wallet", name: "Wallet & Payments", iconComponent: "wallet", color: "#8b5cf6" },
  { id: "withdrawal", name: "Withdrawals", iconComponent: "withdrawal", color: "#ef4444" },
  { id: "account", name: "Account Settings", iconComponent: "account", color: "#06b6d4" },
];

const Help = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [helpArticles, setHelpArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await helpArticleAPI.getAll();
        if (response.success) {
          setHelpArticles(response.data || []);
        } else {
          throw new Error(response.message || 'Failed to fetch articles');
        }
      } catch (err) {
        console.error('Error fetching help articles:', err);
        setError(err.message || 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const popularArticles = helpArticles.filter(article => article.isPopular).slice(0, 4);

  const handleCategoryClick = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategory(category.name);
      setSearchQuery("");
    }
  };

  const handleArticleClick = (articleId) => {
    navigate(`/help/${articleId}`);
  };

  if (loading) {
    return (
      <div className="help-page">
        <header className="help-header">
          <button
            type="button"
            className="help-header__back"
            onClick={() => navigate("/profile")}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="help-header__title">Help Center</h1>
          <div className="help-header__spacer"></div>
        </header>
        <div className="help-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error && helpArticles.length === 0) {
    return (
      <div className="help-page">
        <header className="help-header">
          <button
            type="button"
            className="help-header__back"
            onClick={() => navigate("/profile")}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="help-header__title">Help Center</h1>
          <div className="help-header__spacer"></div>
        </header>
        <div className="help-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="help-page">
      {/* Header */}
      <header className="help-header">
        <button
          type="button"
          className="help-header__back"
          onClick={() => navigate("/profile")}
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="help-header__title">Help Center</h1>
        <div className="help-header__spacer"></div>
      </header>

      <div className="help-content">
        {/* Search */}
        <div className="help-search">
          <div className="help-search__wrapper">
            <svg
              className="help-search__icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="help-search__input"
              placeholder="Search for articles, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="help-search__clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="help-quick-actions">
          <button
            type="button"
            className="help-quick-action"
            onClick={() => navigate("/faq")}
          >
            <HelpIcon size={24} color="#3b82f6" />
            <span>FAQ</span>
          </button>
          <button
            type="button"
            className="help-quick-action"
            onClick={() => navigate("/chat")}
          >
            <SupportIcon size={24} color="#3b82f6" />
            <span>Contact Support</span>
          </button>
        </div>

        {/* Categories */}
        {!searchQuery && !selectedCategory && (
          <div className="help-section">
            <h2 className="help-section__title">Browse by Category</h2>
            <div className="help-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="help-category-card"
                  onClick={() => handleCategoryClick(category.id)}
                  style={{ borderColor: category.color }}
                >
                  <div className="help-category-card__icon" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                    {getCategoryIcon(category.id)}
                  </div>
                  <h3 className="help-category-card__title">{category.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Articles */}
        {!searchQuery && !selectedCategory && (
          <div className="help-section">
            <h2 className="help-section__title">Popular Articles</h2>
            <div className="help-articles">
              {popularArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  className="help-article-card"
                  onClick={() => handleArticleClick(article._id || article.id)}
                >
                  <div className="help-article-card__icon">{getArticleIcon(article.iconComponent)}</div>
                  <div className="help-article-card__content">
                    <h3 className="help-article-card__title">{article.title}</h3>
                    <p className="help-article-card__description">{article.description}</p>
                  </div>
                  <svg
                    className="help-article-card__arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {(searchQuery || selectedCategory) && (
          <div className="help-section">
            <div className="help-section__header">
              <h2 className="help-section__title">
                {selectedCategory ? `${selectedCategory} Articles` : "Search Results"}
              </h2>
              {(searchQuery || selectedCategory) && (
                <button
                  type="button"
                  className="help-section__clear"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {filteredArticles.length > 0 ? (
              <div className="help-articles">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    className="help-article-card"
                    onClick={() => handleArticleClick(article._id || article.id)}
                  >
                    <div className="help-article-card__icon">{getArticleIcon(article.iconComponent)}</div>
                    <div className="help-article-card__content">
                      <h3 className="help-article-card__title">{article.title}</h3>
                      <p className="help-article-card__description">{article.description}</p>
                    </div>
                    <svg
                      className="help-article-card__arrow"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="help-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p>No articles found. Try a different search term.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Help;

