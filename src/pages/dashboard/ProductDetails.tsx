import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts, Product } from "@/contexts/ProductContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find((p) => p.id === Number(id));
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setNotFound(true);
      }
    }
  }, [id, products]);

  if (notFound) {
    return (
      <DashboardLayout title="Product Not Found">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(product);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <DashboardLayout title={product.title}>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Product Image */}
        <Card className="card-highlight">
          <CardContent className="p-6">
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center p-8">
              <img
                src={product.image}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <div className="space-y-6">
          <Card className="card-highlight">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="capitalize text-xs bg-gray-50"
                >
                  {product.category}
                </Badge>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">
                    {product.rating.rate} ({product.rating.count} reviews)
                  </span>
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold mt-2">
                {product.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{product.description}</p>
                <div className="text-3xl font-bold text-brand-highlight">
                  ${product.price.toFixed(2)}
                </div>
                <Button
                  size="lg"
                  className="w-full bg-brand-highlight hover:bg-brand-darkred"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductDetails;
