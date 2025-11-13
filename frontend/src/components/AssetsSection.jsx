import { useAppState } from "../context/AppStateContext.jsx";
import { useNavigate } from "react-router-dom";
import AssetCard from "./AssetCard.jsx";

const AssetsSection = () => {
  const { holdings } = useAppState();
  const navigate = useNavigate();

  const handleViewDetail = (holding) => {
    // Navigate to property detail page
    console.log("View detail for:", holding);
    // TODO: Navigate to property detail page when created
    // navigate(`/property/${holding.id}`);
  };

  const handleWithdraw = (holding) => {
    // Handle withdraw action
    console.log("Withdraw for:", holding);
    // TODO: Implement withdraw functionality
    // navigate(`/withdraw/${holding.id}`);
  };

  if (!holdings || holdings.length === 0) {
    return (
      <div className="assets-section">
        <h2 className="assets-section__title">Current Holdings</h2>
        <div className="assets-section__empty">
          <p>No holdings yet. Start investing to see your assets here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assets-section">
      <h2 className="assets-section__title">Current Holdings</h2>
      <div className="assets-section__container">
        <div className="assets-section__cards">
          {holdings.map((holding) => (
            <AssetCard
              key={holding.id}
              holding={holding}
              onViewDetail={handleViewDetail}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetsSection;

