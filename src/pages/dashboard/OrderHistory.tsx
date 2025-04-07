import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const OrderHistory = () => {
  const { orders } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom date filtering logic
  const getDateRange = (dateRange: string) => {
    const today = new Date();
    const dateRanges: Record<string, Date | null> = {
      all: null,
      "7days": new Date(today.setDate(today.getDate() - 7)),
      "30days": new Date(today.setDate(today.getDate() - 30)),
      "90days": new Date(today.setDate(today.getDate() - 90)),
      "12months": new Date(today.setFullYear(today.getFullYear() - 1)),
    };

    return dateRanges[dateRange] || null;
  };

  // Filter orders based on search, status, and date
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    // Date range filtering
    let matchesDateRange = true;
    const minDate = getDateRange(dateRange);
    if (minDate) {
      const orderDate = new Date(order.date);
      matchesDateRange = orderDate >= minDate;
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Sort orders with most recent first
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to export orders as PDF
  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Order History", 14, 22);

      // Add date of export
      doc.setFontSize(11);
      doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Create table data
      const tableColumn = [
        "Order ID",
        "Date",
        "Customer",
        "Status",
        "Items",
        "Total",
      ];
      const tableRows = sortedOrders.map((order) => [
        `#${order.id.substring(order.id.length - 6)}`,
        formatDateWithYear(order.date),
        order.customerName,
        order.status === "shipped" ? "On The Way" : order.status,
        order.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
        `$${order.total.toFixed(2)}`,
      ]);

      // @ts-ignore - jspdf-autotable types are not recognized
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202] },
      });

      doc.save("order-history.pdf");
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Function to export orders as DOCX (simulated with PDF for demo)
  const exportToDocx = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Order History - DOCX Format", 14, 22);

      // Add date of export
      doc.setFontSize(11);
      doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Create table data
      const tableColumn = [
        "Order ID",
        "Date",
        "Customer",
        "Status",
        "Items",
        "Total",
      ];
      const tableRows = sortedOrders.map((order) => [
        `#${order.id.substring(order.id.length - 6)}`,
        formatDateWithYear(order.date),
        order.customerName,
        order.status === "shipped" ? "On The Way" : order.status,
        order.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
        `$${order.total.toFixed(2)}`,
      ]);

      // @ts-ignore - jspdf-autotable types are not recognized
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [121, 85, 72] },
      });

      doc.save("order-history.docx.pdf");
      toast.success("Word document exported successfully");
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      toast.error("Failed to export Word document");
    } finally {
      setIsExporting(false);
    }
  };

  // Function to export orders as Excel
  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // Prepare data for Excel export
      const excelData = sortedOrders.map((order) => ({
        "Order ID": `#${order.id.substring(order.id.length - 6)}`,
        Date: formatDateWithYear(order.date),
        Customer: order.customerName,
        Status: order.status === "shipped" ? "On The Way" : order.status,
        Items: order.items.reduce((sum, item) => sum + item.quantity, 0),
        Total: `$${order.total.toFixed(2)}`,
        "Item Details": order.items
          .map((item) => `${item.title} (x${item.quantity})`)
          .join(", "),
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

      // Auto-size columns
      const maxWidth = excelData.reduce(
        (w, r) => Math.max(w, r["Item Details"].length),
        10
      );
      const colWidth = [
        { wch: 10 }, // Order ID
        { wch: 15 }, // Date
        { wch: 20 }, // Customer
        { wch: 15 }, // Status
        { wch: 8 }, // Items
        { wch: 10 }, // Total
        { wch: maxWidth }, // Item Details
      ];
      worksheet["!cols"] = colWidth;

      // Generate Excel file
      XLSX.writeFile(workbook, "order-history.xlsx");
      toast.success("Excel file exported successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Implement refresh logic here
    setIsLoading(false);
  };

  return (
    <DashboardLayout title="Order History">
      <div className="space-y-6">
        <Card className="card-highlight">
          <CardHeader className="border-b">
            <div className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Past Orders
              </CardTitle>
              <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      "Refresh Orders"
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isExporting || sortedOrders.length === 0}
                      >
                        {isExporting ? (
                          <>
                            <FileDown
                              size={16}
                              className="mr-2 animate-pulse"
                            />{" "}
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download size={16} className="mr-2" /> Export
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={exportToPDF}
                        disabled={isExporting}
                      >
                        <FileText size={16} className="mr-2 text-red-600" />{" "}
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={exportToDocx}
                        disabled={isExporting}
                      >
                        <FileText size={16} className="mr-2 text-blue-600" />{" "}
                        Export as Word
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={exportToExcel}
                        disabled={isExporting}
                      >
                        <FileSpreadsheet
                          size={16}
                          className="mr-2 text-green-600"
                        />{" "}
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">On The Way</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Period:</span>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="12months">Last 12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-medium text-brand-highlight hover:underline"
                          >
                            #{order.id.substring(order.id.length - 6)}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDateWithYear(order.date)}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          <div
                            className={cn(
                              "status-pill",
                              order.status === "processing" &&
                                "status-processing",
                              order.status === "shipped" && "status-on-the-way",
                              order.status === "delivered" &&
                                "status-delivered",
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
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/orders/${order.id}`}>View Details</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No orders found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

export default OrderHistory;
