import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts, type Order } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Search,
  Download,
  ShoppingBag,
  RefreshCw,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { downloadOrderReport } from "@/lib/reportUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Orders = () => {
  const { user } = useAuth();
  const { orders, refreshOrders } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Refresh orders data when component mounts
  useEffect(() => {
    if (user) {
      handleRefresh();
    }
  }, [user]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshOrders();
      toast.success("Orders refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Export orders to PDF
  const handleExportPDF = (order: Order) => {
    downloadOrderReport(order);
  };

  // Export orders to Word
  const handleExportWord = (order: Order) => {
    // Create a simple HTML content
    const content = `
      <h1>Order Details</h1>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <h2>Items</h2>
      <table border="1">
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td>${item.title}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
    `;

    // Convert HTML to Word document
    const blob = new Blob([content], { type: "application/msword" });
    saveAs(blob, `order-${order.id}.doc`);
  };

  // Export orders to Excel
  const handleExportExcel = (order: Order) => {
    const worksheet = XLSX.utils.json_to_sheet(
      order.items.map((item) => ({
        "Product Name": item.title,
        Quantity: item.quantity,
        "Price Per Unit": item.price,
        "Total Price": item.price * item.quantity,
      }))
    );

    // Add summary row
    XLSX.utils.sheet_add_aoa(worksheet, [["", "", "Total:", order.total]], {
      origin: -1,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

    // Save the file
    XLSX.writeFile(workbook, `order-${order.id}.xlsx`);
  };

  // Filter orders based on search query and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get most recent orders
  const recentOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <DashboardLayout title="Orders">
      <div className="space-y-6">
        <Card className="card-highlight">
          <CardHeader className="border-b">
            <div className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Your Orders
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">On The Way</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    placeholder="Search orders..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        if (recentOrders.length > 0) {
                          recentOrders.forEach(handleExportPDF);
                          toast.success("Exporting orders as PDF");
                        } else {
                          toast.error("No orders to export");
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export all as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (recentOrders.length > 0) {
                          recentOrders.forEach(handleExportWord);
                          toast.success("Exporting orders as Word");
                        } else {
                          toast.error("No orders to export");
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export all as Word
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (recentOrders.length > 0) {
                          recentOrders.forEach(handleExportExcel);
                          toast.success("Exporting orders as Excel");
                        } else {
                          toast.error("No orders to export");
                        }
                      }}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export all as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-medium text-brand-highlight hover:underline"
                        >
                          #{order.id.substring(0, 6)}
                        </Link>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div
                          className={cn(
                            "status-pill",
                            order.status === "processing" &&
                              "status-processing",
                            order.status === "shipped" && "status-on-the-way",
                            order.status === "delivered" && "status-delivered",
                            order.status === "cancelled" && "status-cancelled"
                          )}
                        >
                          <span className="capitalize">
                            {order.status === "shipped"
                              ? "On The Way"
                              : order.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/orders/${order.id}`}>
                            <Search className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleExportPDF(order)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportWord(order)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Export as Word
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportExcel(order)}
                            >
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Export as Excel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 px-4">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  You haven't received any orders yet
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  {orders.length === 0
                    ? "Orders will appear here once you place them. Browse products and add them to your cart to get started."
                    : "No orders match your search criteria. Try adjusting your filters."}
                </p>
                <Link to="/products">
                  <Button className="bg-brand-highlight hover:bg-brand-darkred">
                    Browse Products
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

export default Orders;
