import { useState } from "react";
import { useProducts } from "@/contexts/ProductContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Products = () => {
  const {
    filteredProducts,
    categories,
    isLoading,
    error,
    addToCart,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useProducts();

  // State for products with "Add to Cart" loading state
  const [loadingStates, setLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});

  const handleAddToCart = async (productId: number) => {
    // Find product in filtered list
    const product = filteredProducts.find((p) => p.id === productId);
    if (!product) return;

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, [productId]: true }));

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Add product to cart
    addToCart(product);

    // Reset loading state
    setLoadingStates((prev) => ({ ...prev, [productId]: false }));
  };

  return (
    <DashboardLayout title="Products">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all"
                    ? "All Categories"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && (
        <>
          <div className="mb-4 text-sm text-gray-500">
            Showing {filteredProducts.length} products
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">No products found</p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="card-highlight overflow-hidden flex flex-col h-full border border-gray-100"
                >
                  <div className="h-48 overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-full object-contain"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="capitalize text-xs bg-gray-50"
                      >
                        {product.category}
                      </Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-xs text-gray-600">
                          {product.rating.rate} ({product.rating.count})
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/products/${product.id}`}
                      className="text-base font-medium line-clamp-1 mt-2 hover:text-brand-highlight"
                    >
                      {product.title}
                    </Link>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0 flex-1">
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-2 border-t">
                    <div className="font-semibold">
                      ${product.price.toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={loadingStates[product.id]}
                      className="bg-brand-highlight hover:bg-brand-darkred"
                    >
                      {loadingStates[product.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Products;
