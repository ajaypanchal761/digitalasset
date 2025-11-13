import { useAppState } from "../context/AppStateContext.jsx";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard.jsx";

const ExplorePropertiesSection = () => {
  const { listings } = useAppState();
  const navigate = useNavigate();

  const handleInvest = (property) => {
    // Navigate to invest page or property detail
    console.log("Invest in:", property);
    // TODO: Navigate to invest page when created
    // navigate(`/invest/${property.id}`);
    navigate("/invest");
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
            <PropertyCard key={property.id} property={property} onInvest={handleInvest} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplorePropertiesSection;

