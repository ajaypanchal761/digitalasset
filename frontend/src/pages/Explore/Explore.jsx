import { useAppState } from "../../context/AppStateContext.jsx";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../../components/PropertyCard.jsx";

const Explore = () => {
  const { listings, loading, error } = useAppState();
  const navigate = useNavigate();

  const handleInvest = (property) => {
    // Navigate to property detail page
    navigate(`/property/${property._id || property.id}`);
  };

  const handleCardClick = (property) => {
    // Navigate to property detail page on card click
    navigate(`/property/${property._id || property.id}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="explore-properties-section">
        <div className="explore-properties-section__header-wrapper">
          <button className="explore-properties-section__back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
        </div>
        <div className="explore-properties-section__empty">
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="explore-properties-section">
        <div className="explore-properties-section__header-wrapper">
          <button className="explore-properties-section__back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
        </div>
        <div className="explore-properties-section__empty">
          <p>Error loading properties: {error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!listings || listings.length === 0) {
    return (
      <div className="explore-properties-section">
        <div className="explore-properties-section__header-wrapper">
          <button className="explore-properties-section__back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
        </div>
        <div className="explore-properties-section__empty">
          <p>No properties available at the moment. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-properties-section">
      <div className="explore-properties-section__header-wrapper">
        <button className="explore-properties-section__back-btn" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
      </div>
      <div className="explore-properties-section__container">
        <div className="explore-properties-section__cards">
          {listings.map((property) => (
            <PropertyCard key={property._id || property.id} property={property} onInvest={handleInvest} onClick={handleCardClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;

