import { useAppState } from "../../context/AppStateContext.jsx";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../../components/PropertyCard.jsx";

const Explore = () => {
  const { listings } = useAppState();
  const navigate = useNavigate();

  const handleInvest = (property) => {
    // Navigate to property detail page
    navigate(`/property/${property.id}`);
  };

  const handleCardClick = (property) => {
    // Navigate to property detail page on card click
    navigate(`/property/${property.id}`);
  };

  if (!listings || listings.length === 0) {
    return (
      <div className="explore-properties-section">
        <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
        <div className="explore-properties-section__empty">
          <p>No properties available at the moment. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-properties-section">
      <h2 className="explore-properties-section__title">Explore Digital Properties</h2>
      <div className="explore-properties-section__container">
        <div className="explore-properties-section__cards">
          {listings.map((property) => (
            <PropertyCard key={property.id} property={property} onInvest={handleInvest} onClick={handleCardClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;

