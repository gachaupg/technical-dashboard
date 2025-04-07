import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts, Order } from "@/contexts/ProductContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ArrowLeft,
  MessageSquare,
  FileDown,
  Save,
  FilePieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadOrderReport, downloadOrderHTMLReport } from "@/lib/reportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useProducts();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      const foundOrder = orders.find((o) => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setNotFound(true);
      }
    }
  }, [id, orders]);

  if (notFound) {
    return (
      <DashboardLayout title="Order Not Found">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'shipped': return 'On The Way';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleDownloadCSV = () => {
    downloadOrderReport(order);
  };

  const handleDownloadHTMLReport = () => {
    downloadOrderHTMLReport(order);
  };

  return (
    <DashboardLayout title="Order Details">
      <div className="space-y-6">
        {/* Header with order number and message button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => navigate('/orders')} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Order Number <span className="text-brand-highlight">#{order.id.substring(order.id.length - 6)}</span></h1>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Choose format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadCSV}>
                  <FilePieChart className="mr-2 h-4 w-4" />
                  CSV Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadHTMLReport}>
                  <Save className="mr-2 h-4 w-4" />
                  HTML Receipt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-gray-800 text-white hover:bg-gray-900">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Customer
            </Button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <Card className="card-highlight">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Items summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[60%]">Product</TableHead>
                      <TableHead className="text-center">QTY</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-contain p-1"
                              />
                            </div>
                            <span className="font-medium">{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">x {item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Customer And Order Details */}
            <Card className="card-highlight mt-6">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Customer And Order Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="px-6 py-4 grid grid-cols-2">
                    <div>
                      <div className="text-sm text-gray-500">Customer Name</div>
                      <div className="font-medium mt-1">{order.customerName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone Number</div>
                      <div className="font-medium mt-1">{order.customerPhone || "7918881829"}</div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 grid grid-cols-2">
                    <div>
                      <div className="text-sm text-gray-500">Bag Option</div>
                      <div className="font-medium mt-1">No Bag</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Type</div>
                      <div className="font-medium mt-1">Delivery</div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="text-sm text-gray-500">Note</div>
                    <div className="font-medium mt-1">N/A</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Rider Details */}
            <Card className="card-highlight">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Rider Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=rider-${order.id}`}
                        alt="Rider" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">Robart Suvent</h3>
                    </div>
                  </div>
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    Track Rider
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="card-highlight">
              <CardHeader className="flex flex-row justify-between items-center border-b pb-3">
                <CardTitle className="text-lg">Order summary</CardTitle>
                <div className="status-pill status-on-the-way">
                  {getOrderStatusText(order.status)}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="text-gray-500">Order Created</div>
                    <div>{new Date(order.date).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="text-gray-500">Order Time</div>
                    <div>{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="text-gray-500">Subtotal</div>
                    <div>${order.total.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="text-gray-500">Delivery Fee</div>
                    <div>$0.00</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold">
                    <div>Total</div>
                    <div>${order.total.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Delivery Address */}
            <Card className="card-highlight">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div>
                  <div className="text-gray-500">Address line:</div>
                  <div>14 Anglesey Road</div>
                </div>
                <div>
                  <div className="text-gray-500">Flat / Building Name:</div>
                  <div>James Court</div>
                </div>
                <div>
                  <div className="text-gray-500">Street Name:</div>
                  <div>Anglesey Road</div>
                </div>
                <div>
                  <div className="text-gray-500">Postcode:</div>
                  <div>EN3 4hy</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderDetails;
