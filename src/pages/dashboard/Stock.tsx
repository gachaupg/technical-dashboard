
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  lastRestocked: string;
  supplier: string;
}

const stockItems: StockItem[] = [
  {
    id: "STK001",
    name: "White T-Shirt (S)",
    category: "Apparel",
    quantity: 45,
    threshold: 20,
    lastRestocked: "2025-03-15",
    supplier: "Fashion Wholesale Inc."
  },
  {
    id: "STK002",
    name: "Black Jeans (M)",
    category: "Apparel",
    quantity: 12,
    threshold: 15,
    lastRestocked: "2025-03-10",
    supplier: "Denim Supply Co."
  },
  {
    id: "STK003",
    name: "Wireless Headphones",
    category: "Electronics",
    quantity: 8,
    threshold: 10,
    lastRestocked: "2025-03-05",
    supplier: "Tech Gadgets Ltd."
  },
  {
    id: "STK004",
    name: "Stainless Steel Water Bottle",
    category: "Home Goods",
    quantity: 30,
    threshold: 15,
    lastRestocked: "2025-03-18",
    supplier: "EcoProducts Inc."
  },
  {
    id: "STK005",
    name: "Leather Wallet",
    category: "Accessories",
    quantity: 25,
    threshold: 10,
    lastRestocked: "2025-02-28",
    supplier: "Luxury Accessories Co."
  }
];

const Stock = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockItem, direction: 'asc' | 'desc' } | null>(null);

  // Filter stock based on search
  const filteredStock = stockItems.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort stock items
  const sortedStock = [...filteredStock].sort((a, b) => {
    if (!sortConfig) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: keyof StockItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity <= threshold * 0.5) return "low";
    if (quantity <= threshold) return "medium";
    return "good";
  };

  return (
    <DashboardLayout title="Stock Management">
      <div className="space-y-6">
        <Card className="card-highlight">
          <CardHeader className="border-b">
            <div className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">Inventory Stock</CardTitle>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search inventory..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="bg-brand-highlight hover:bg-brand-darkred">
                  <Plus size={16} className="mr-2" /> Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('id')}>
                    ID <ArrowUpDown size={14} className="inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
                    Item <ArrowUpDown size={14} className="inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('category')}>
                    Category <ArrowUpDown size={14} className="inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('quantity')}>
                    Quantity <ArrowUpDown size={14} className="inline ml-1" />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('lastRestocked')}>
                    Last Restocked <ArrowUpDown size={14} className="inline ml-1" />
                  </TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStock.map((item) => {
                  const status = getStockStatus(item.quantity, item.threshold);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Badge className={
                          status === "low" ? "bg-red-100 text-red-800" :
                          status === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }>
                          {status === "low" ? "Low Stock" :
                           status === "medium" ? "Medium Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.lastRestocked).toLocaleDateString()}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {sortedStock.length === 0 && (
              <div className="text-center py-10">
                <p className="text-lg font-medium">No stock items found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Stock;
