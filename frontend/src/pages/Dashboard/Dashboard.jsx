import { useEffect, useRef } from "react";
import { useAppState } from "../../context/AppStateContext.jsx";
import AssetsSection from "../../components/AssetsSection.jsx";
import ExplorePropertiesSection from "../../components/ExplorePropertiesSection.jsx";

const Dashboard = () => {
  const { holdings, listings, loading: holdingsLoading } = useAppState();
  const observerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: [0, 0.1, 0.2],
      rootMargin: "0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("dashboard-item--visible");
        } else {
          // Remove class when element leaves viewport to allow re-animation
          entry.target.classList.remove("dashboard-item--visible");
        }
      });
    }, observerOptions);

    observerRef.current = observer;

    // Scroll handler as backup to ensure animations trigger on every scroll
    const handleScroll = () => {
      const elements = document.querySelectorAll(".dashboard-section, .dashboard-card, .dashboard-wallet-card");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
        if (isVisible) {
          el.classList.add("dashboard-item--visible");
        } else {
          // Remove class when element leaves viewport to allow re-animation
          el.classList.remove("dashboard-item--visible");
        }
      });
    };

    // Throttled scroll handler - triggers on every scroll
    const throttledScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        handleScroll();
        scrollTimeoutRef.current = null;
      }, 50); // Reduced delay for more responsive animations
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    
    // Initial check
    handleScroll();

    const setupObserver = () => {
      // Observe wallet card if present (in mobile header)
      const walletCard = document.querySelector(".mobile-header .wallet-summary-card");
      if (walletCard) {
        if (!walletCard.classList.contains("dashboard-wallet-card")) {
          walletCard.classList.add("dashboard-wallet-card");
        }
        // Check if already visible and add class immediately
        const rect = walletCard.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          walletCard.classList.add("dashboard-item--visible");
        }
        observer.observe(walletCard);
      }

      // Observe all dashboard sections
      const sections = document.querySelectorAll(".dashboard .assets-section, .dashboard .explore-properties-section");
      sections.forEach((section) => {
        if (!section.classList.contains("dashboard-section")) {
          section.classList.add("dashboard-section");
        }
        // Check if already visible and add class immediately
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          section.classList.add("dashboard-item--visible");
        }
        observer.observe(section);
      });

      // Observe all cards with delay
      const assetCards = document.querySelectorAll(".dashboard .asset-card");
      const propertyCards = document.querySelectorAll(".dashboard .property-card");
      
      assetCards.forEach((card, index) => {
        if (!card.classList.contains("dashboard-card")) {
          card.classList.add("dashboard-card");
          // Add delay based on index
          card.style.setProperty("--animation-delay", `${index * 0.1}s`);
        }
        // Check if already visible and add class immediately
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          card.classList.add("dashboard-item--visible");
        }
        observer.observe(card);
      });

      propertyCards.forEach((card, index) => {
        if (!card.classList.contains("dashboard-card")) {
          card.classList.add("dashboard-card");
          // Add delay based on index
          card.style.setProperty("--animation-delay", `${index * 0.1}s`);
        }
        // Check if already visible and add class immediately
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          card.classList.add("dashboard-item--visible");
        }
        observer.observe(card);
      });
    };

    // Setup observer immediately and after delays
    setupObserver(); // Run immediately
    
    const timeoutId = setTimeout(setupObserver, 100);
    const timeoutId2 = setTimeout(setupObserver, 300);

    // Re-setup when data changes (after loading completes)
    if (!holdingsLoading) {
      const dataTimeoutId = setTimeout(setupObserver, 500);
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
        clearTimeout(dataTimeoutId);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        window.removeEventListener("scroll", throttledScroll);
        const allElements = document.querySelectorAll(".dashboard-section, .dashboard-card, .dashboard-wallet-card");
        allElements.forEach((el) => {
          if (observer) observer.unobserve(el);
        });
      };
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      window.removeEventListener("scroll", throttledScroll);
      if (observerRef.current) {
        const allElements = document.querySelectorAll(".dashboard-section, .dashboard-card, .dashboard-wallet-card");
        allElements.forEach((el) => observerRef.current.unobserve(el));
      }
    };
  }, [holdings, listings, holdingsLoading]);

  return (
    <div className="dashboard">
      <AssetsSection />
      <ExplorePropertiesSection />
    </div>
  );
};

export default Dashboard;

