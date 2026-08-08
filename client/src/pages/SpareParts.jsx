import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import CartModal from "../components/CartModal";
import FloatingCartButton from "../components/FloatingCartButton";
import { apiService } from "../routing/apiClient";

const PARTS_IMAGE_BASE = "https://api.roadengo.com";

const SpareParts = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rawParts, setRawParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, getCartItemsCount, isCartOpen, toggleCart } = useCart();

  useEffect(() => {
    apiService
      .getParts()
      .then((res) => setRawParts(res.data || []))
      .catch(() => setRawParts([]))
      .finally(() => setLoading(false));
  }, []);

  // Map the admin-managed catalog into the shape this page (and the cart)
  // already expects — price as a "₹123" string, image as a full URL.
  const spareParts = useMemo(
    () =>
      rawParts.map((p) => {
        const discounted = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
        return {
          id: p._id,
          name: p.name,
          category: (p.category || "general").toLowerCase(),
          price: `₹${discounted}`,
          originalPrice: p.discount ? `₹${p.price}` : null,
          image: p.photo ? `${PARTS_IMAGE_BASE}${p.photo}` : "/images/oil-filter.jpg",
          brand: p.category || "Roadengo",
          inStock: p.inStock !== false,
          installation: "Free",
        };
      }),
    [rawParts]
  );

  const categories = useMemo(() => {
    const seen = new Map();
    rawParts.forEach((p) => {
      const cat = (p.category || "general").toLowerCase();
      if (!seen.has(cat)) seen.set(cat, p.category || "General");
    });
    return [
      { id: "all", name: "All Parts", icon: "ri-tools-line" },
      ...Array.from(seen.entries()).map(([id, name]) => ({ id, name, icon: "ri-settings-3-line" })),
    ];
  }, [rawParts]);

  const filteredParts = spareParts.filter((part) => {
    const matchesCategory =
      selectedCategory === "all" || part.category === selectedCategory;
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (part) => {
    if (part.inStock) {
      addToCart(part);
      // Show success message
      alert(`${part.name} added to cart!`);
    }
  };

  return (
    <>
      <div className="bg-white min-h-screen">
        {/* Hero Section - Mobile Optimized */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Genuine <span className="text-red-200">Spare Parts</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-red-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Original equipment quality parts for all bike models with free
              doorstep installation
            </p>

            {/* Search Bar - Mobile Optimized with Better Colors */}
            <div className="max-w-sm sm:max-w-md mx-auto relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search parts, brand or model..."
                  className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-full text-gray-900 font-medium text-sm sm:text-lg bg-white/90 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 focus:bg-white focus:border-white/40 placeholder:text-gray-500 shadow-lg transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="ri-search-line absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg sm:text-xl pointer-events-none"></i>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Filter - Mobile Optimized */}
        <section className="py-8 sm:py-10 md:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile: Horizontal scroll, Tablet+: Wrap */}
            <div className="flex sm:flex-wrap gap-3 sm:gap-4 justify-start sm:justify-center overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                    selectedCategory === category.id
                      ? "bg-red-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <i className={`${category.icon} text-base sm:text-lg`}></i>
                  <span className="hidden xs:inline sm:inline">
                    {category.name}
                  </span>
                  <span className="xs:hidden sm:hidden">
                    {category.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Parts Grid - Mobile 2 Columns */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-8 sm:mb-10 md:mb-12 text-center px-2">
              {selectedCategory === "all"
                ? "All Spare Parts"
                : `${categories.find((c) => c.id === selectedCategory)?.name}`}
            </h2>

            {/* Mobile: 2 cols, Tablet: 3 cols, Desktop: 4 cols */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {filteredParts.map((part) => (
                <div
                  key={part.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Part Image - Mobile Optimized */}
                  <div className="relative h-32 sm:h-40 lg:h-48 bg-gray-100">
                    <img
                      src={part.image}
                      alt={part.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      onError={(e) => {
                        if (e.target.src.includes("placeholder")) return;
                        e.target.onerror = null;
                        e.target.src = `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=60`;
                      }}
                    />

                    {/* Stock Status Badge */}
                    {!part.inStock && (
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-600 text-white px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold">
                        Out of Stock
                      </div>
                    )}

                    {/* Discount Badge */}
                    {part.originalPrice && (
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold">
                        {Math.round(
                          ((parseInt(part.originalPrice.slice(1)) -
                            parseInt(part.price.slice(1))) /
                            parseInt(part.originalPrice.slice(1))) *
                            100
                        )}
                        % OFF
                      </div>
                    )}
                  </div>

                  {/* Part Details - Mobile Compact */}
                  <div className="p-3 sm:p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base leading-tight flex-1 mr-1 sm:mr-2">
                        {part.name}
                      </h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                        {part.brand}
                      </span>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                        {part.price}
                      </span>
                      {part.originalPrice && (
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          {part.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Installation */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                      <i className="ri-tools-line text-red-600 text-xs sm:text-sm"></i>
                      <span className="text-xs text-gray-600">
                        Install:{" "}
                        {part.installation === "Free" ? (
                          <span className="text-green-600 font-semibold">
                            Free
                          </span>
                        ) : (
                          <span className="font-semibold">
                            {part.installation}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Action Button - Mobile Compact */}
                    <button
                      disabled={!part.inStock}
                      onClick={() => handleAddToCart(part)}
                      className={`w-full py-2 sm:py-2.5 lg:py-3 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base ${
                        part.inStock
                          ? "bg-red-600 hover:bg-red-700 text-white active:bg-red-800"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {part.inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-12 sm:py-16 text-gray-400 text-sm">Loading parts…</div>
            )}

            {/* No Results Message */}
            {!loading && filteredParts.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <i className="ri-search-line text-4xl sm:text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                  {rawParts.length === 0 ? "No parts available yet" : "No parts found"}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {rawParts.length === 0
                    ? "Please check back soon."
                    : "Try adjusting your search or category filter"}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Cart Modal */}
        {isCartOpen && <CartModal />}
      </div>

      <FloatingCartButton />
    </>
  );
};

export default SpareParts;
