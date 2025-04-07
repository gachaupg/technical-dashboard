
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Tag, ArrowRight } from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  code: string;
  category: string;
}

const sampleOffers: Offer[] = [
  {
    id: "offer1",
    title: "Summer Special",
    description: "Get 15% off on all summer items",
    discount: "15%",
    validUntil: "2025-08-30",
    code: "SUMMER15",
    category: "seasonal"
  },
  {
    id: "offer2",
    title: "New Customer",
    description: "Welcome discount for new customers",
    discount: "10%",
    validUntil: "2025-12-31",
    code: "WELCOME10",
    category: "new-users"
  },
  {
    id: "offer3",
    title: "Bulk Purchase",
    description: "Buy 5 or more items and get 20% off",
    discount: "20%",
    validUntil: "2025-06-15",
    code: "BULK20",
    category: "bulk"
  },
  {
    id: "offer4",
    title: "Flash Sale",
    description: "24 hours only - 25% off selected items",
    discount: "25%",
    validUntil: "2025-05-01",
    code: "FLASH25",
    category: "limited-time"
  }
];

const Offers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter offers based on search and category
  const filteredOffers = sampleOffers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || offer.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(sampleOffers.map(offer => offer.category)));

  return (
    <DashboardLayout title="Offers">
      <div className="space-y-6">
        {/* Header with search */}
        <Card className="card-highlight">
          <CardHeader className="border-b">
            <div className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">Current Offers</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search offers..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={selectedCategory === null ? "secondary" : "outline"} 
                onClick={() => setSelectedCategory(null)}
                className="text-sm"
              >
                All
              </Button>
              {categories.map(category => (
                <Button 
                  key={category} 
                  variant={selectedCategory === category ? "secondary" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm capitalize"
                >
                  {category.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="card-highlight">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <CardDescription className="mt-1">{offer.description}</CardDescription>
                  </div>
                  <Badge className="bg-brand-red">{offer.discount}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Clock size={16} className="mr-2" />
                  <span>Valid until: {new Date(offer.validUntil).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Tag size={16} className="mr-2" />
                  <span>Code: <span className="font-semibold">{offer.code}</span></span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-between">
                <span className="text-xs capitalize px-2 py-1 bg-gray-100 rounded-full">{offer.category.replace('-', ' ')}</span>
                <Button variant="ghost" size="sm" className="text-brand-highlight">
                  Apply <ArrowRight size={16} className="ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-lg font-medium">No offers found</p>
            <p className="text-sm text-gray-500 mt-2">Try changing your search terms</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Offers;
