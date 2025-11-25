import { useAppState } from "../context/AppStateContext.jsx";
import { useNavigate } from "react-router-dom";
import AssetCard from "./AssetCard.jsx";

const AssetsSection = () => {
  const { holdings, loading, error } = useAppState();
  const navigate = useNavigate();

  const handleViewDetail = (holding) => {
    // Navigate to holding detail page
    navigate(`/holding/${holding._id || holding.id}`);
  };

  const handleWithdraw = (holding) => {
    // Navigate to withdraw-info page with holding ID - use _id if available, otherwise id
    const holdingId = holding._id || holding.id;
    navigate("/withdraw-info", { state: { holdingId } });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="assets-section">
        <h2 className="assets-section__title">Current Holdings</h2>
        <div className="assets-section__empty">
          <p>Loading holdings...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="assets-section">
        <h2 className="assets-section__title">Current Holdings</h2>
        <div className="assets-section__empty">
          <p>Error loading holdings: {error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
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

  const initialDisplayCount = 3;
  const displayedHoldings = holdings.slice(0, initialDisplayCount);
  const hasMoreHoldings = holdings.length > initialDisplayCount;

  const handleViewAll = () => {
    navigate("/holdings");
  };

  return (
    <div className="assets-section">
      <div className="assets-section__header">
        <h2 className="assets-section__title">Current Holdings</h2>
        {hasMoreHoldings && (
          <button
            type="button"
            className="assets-section__view-all-btn"
            onClick={handleViewAll}
          >
            View All
          </button>
        )}
      </div>
      <div className="assets-section__container">
        <div className="assets-section__cards">
          {displayedHoldings.map((holding) => (
            <AssetCard
              key={holding._id || holding.id}
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

