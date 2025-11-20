import { useAppState } from "../context/AppStateContext.jsx";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard.jsx";

const ExplorePropertiesSection = () => {
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

  const handleViewAll = () => {
    navigate("/explore");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="explore-properties-section">
        <div className="explore-properties-section__header">
          <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
          <button className="explore-properties-section__view-all-btn" onClick={handleViewAll}>
            View All
          </button>
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
        <div className="explore-properties-section__header">
          <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
          <button className="explore-properties-section__view-all-btn" onClick={handleViewAll}>
            View All
          </button>
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
        <div className="explore-properties-section__header">
          <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
          <button className="explore-properties-section__view-all-btn" onClick={handleViewAll}>
            View All
          </button>
        </div>
        <div className="explore-properties-section__empty">
          <p>No properties available at the moment. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-properties-section">
      <div className="explore-properties-section__header">
        <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
        <button className="explore-properties-section__view-all-btn" onClick={handleViewAll}>
          View All
        </button>
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

export default ExplorePropertiesSection;

