import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  KYCIcon,
  InvestmentIcon,
  WalletIcon,
  WithdrawalIcon,
  AccountIcon,
  TechnicalIcon,
} from "../../components/HelpIcons.jsx";
import { helpArticleAPI } from "../../services/api";
import { markdownToHtml } from "../../utils/markdown.js";
import "./ArticleDetail.css";

// Icon mapping function
const getArticleIcon = (category) => {
  const iconProps = { size: 48, color: "#3b82f6" };
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
      return <KYCIcon {...iconProps} />;
  }
};

const getRelatedArticleIcon = (category) => {
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
      return <KYCIcon {...iconProps} />;
  }
};

const ArticleDetail = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  // Fetch article from API
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await helpArticleAPI.getById(articleId);
        if (response.success) {
          setArticle(response.data);
          // Set related articles if available
          if (response.data.relatedArticles && response.data.relatedArticles.length > 0) {
            setRelatedArticles(response.data.relatedArticles);
          }
        } else {
          throw new Error(response.message || 'Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="article-detail-page">
        <header className="article-detail-header">
          <button
            type="button"
            className="article-detail-header__back"
            onClick={() => navigate("/help")}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="article-detail-header__title">Help Article</h1>
          <div className="article-detail-header__spacer"></div>
        </header>
        <div className="article-detail-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-page">
        <header className="article-detail-header">
          <button
            type="button"
            className="article-detail-header__back"
            onClick={() => navigate("/help")}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="article-detail-header__title">Article Not Found</h1>
          <div className="article-detail-header__spacer"></div>
        </header>
        <div className="article-detail-content">
          <div className="article-detail-empty">
            <p>{error || 'Article not found. Please go back and try again.'}</p>
            <button
              type="button"
              className="article-detail-empty__button"
              onClick={() => navigate("/help")}
            >
              Back to Help Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      {/* Header */}
      <header className="article-detail-header">
        <button
          type="button"
          className="article-detail-header__back"
          onClick={() => navigate("/help")}
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="article-detail-header__title">Help Article</h1>
        <div className="article-detail-header__spacer"></div>
      </header>

      <div className="article-detail-content">
        {/* Breadcrumb */}
        <nav className="article-detail-breadcrumb">
          <button type="button" onClick={() => navigate("/help")}>
            Help Center
          </button>
          <span>/</span>
          <span>{article.category}</span>
          <span>/</span>
          <span>{article.title}</span>
        </nav>

        {/* Article */}
        <article className="article-detail-article">
          <div className="article-detail-article__header">
            <div className="article-detail-article__icon">{getArticleIcon(article.category)}</div>
            <div>
              <span className="article-detail-article__category">{article.category}</span>
              <h1 className="article-detail-article__title">{article.title}</h1>
            </div>
          </div>

          <div
            className="article-detail-article__body"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }}
          />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="article-detail-related">
            <h2 className="article-detail-related__title">Related Articles</h2>
            <div className="article-detail-related__list">
              {relatedArticles.map((related) => (
                <button
                  key={related.id}
                  type="button"
                  className="article-detail-related__item"
                  onClick={() => navigate(`/help/${related._id || related.id}`)}
                >
                  <div className="article-detail-related__icon">{getRelatedArticleIcon(related.category)}</div>
                  <div className="article-detail-related__content">
                    <h3 className="article-detail-related__title-item">{related.title}</h3>
                    <span className="article-detail-related__category">{related.category}</span>
                  </div>
                  <svg
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

        {/* Help Section */}
        <div className="article-detail-help">
          <div className="article-detail-help__card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Still need help?</h3>
            <p>Can't find what you're looking for? Contact our support team.</p>
            <button
              type="button"
              className="article-detail-help__button"
              onClick={() => navigate("/chat")}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;

