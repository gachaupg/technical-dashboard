import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/ProductContext";
import { Order } from "@/contexts/ProductContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDateWithYear, formatCurrency } from "@/lib/utils";
import {
  Loader2,
  User,
  MessageSquare,
  ListOrdered,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { simulateOrderUpdates } from "@/lib/firestore";

const LiveOrders = () => {
  const { user } = useAuth();
  const { orders, updateOrderStatusLocal, refreshOrders } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Filter orders to only show processing/live orders
  const liveOrders = orders.filter(
    (order) => order.status === "processing" || order.status.includes("live")
  );

  // Get selected order details
  const selectedOrder = selectedOrderId
    ? liveOrders.find((order) => order.id === selectedOrderId)
    : liveOrders.length > 0
    ? liveOrders[0]
    : null;

  // Refresh orders data when component mounts
  useEffect(() => {
    if (user) {
      handleRefresh();
    }
  }, [user]);

  // Set up a periodic simulation for order updates (for demo purposes)
  useEffect(() => {
    if (!user) return;

    // Simulate order updates periodically
    const simulationInterval = setInterval(() => {
      simulateOrderUpdates(user.id);
    }, 20000); // Simulate every 20 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(simulationInterval);
    };
  }, [user]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshOrders();
      toast.success("Orders refreshed");
    } catch (error) {
      console.error("Error refreshing orders:", error);
      toast.error("Failed to refresh orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Change order status handler
  const handleStatusChange = async (
    orderId: string,
    newStatus: "processing" | "shipped" | "delivered" | "cancelled"
  ) => {
    try {
      await updateOrderStatusLocal(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return "N/A";
    return phone;
  };

  // Get status display text
  const getStatusText = (status: string) => {
    if (status === "shipped") return "On The Way";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle showing empty state if no orders
  if (liveOrders.length === 0) {
    return (
      <DashboardLayout title="Live Orders">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Live Orders</h1>
              <p className="text-gray-500">No active orders in progress</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="py-2 px-4 flex items-center">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                Open For Order
              </Badge>
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
            </div>
          </div>

          {/* Empty state */}
          <Card className="border-dashed bg-gray-50/50">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <ListOrdered className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-1 text-2xl font-bold">No Live Orders</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  You don't have any active orders at the moment. Orders with
                  "Processing" status will appear here.
                </p>
                <Button onClick={handleRefresh} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    "Refresh Orders"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Live Orders">
      <div className="space-y-6">
        {/* Header Section - ExactConnect style */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Order Number</h2>
            <span className="text-red-600 font-semibold ml-2">
              #
              {selectedOrder
                ? selectedOrder.id.substring(selectedOrder.id.length - 6)
                : ""}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-6"
              onClick={() => toast.info("Message feature coming soon")}
            >
              Message Customer
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="py-2 px-4 flex items-center">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
              Open For Order
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main content - Items & Order Details */}
          <div className="md:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="bg-white pb-2 border-b">
                <h3 className="font-medium text-base">Items summary</h3>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-gray-500 text-sm">
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium text-center">QTY</th>
                      <th className="px-6 py-3 font-medium text-right">
                        Price
                      </th>
                      <th className="px-6 py-3 font-medium text-right">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder &&
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-full w-full object-contain p-1"
                                />
                              </div>
                              <span className="font-medium text-sm">
                                {item.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            x {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Customer and Order Details - Bottom section of main panel */}
            <Card className="mt-4 shadow-sm">
              <CardHeader className="pb-3 border-b bg-white">
                <h3 className="font-medium text-base">
                  Customer And Order Details
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                {selectedOrder && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-gray-500">Customer Name</span>
                        <span className="font-medium">
                          {selectedOrder.customerName}
                        </span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-gray-500">Phone Number</span>
                        <span className="font-medium">
                          {formatPhoneNumber(selectedOrder.customerPhone)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium">
                          {selectedOrder.customerEmail}
                        </span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium">Delivery</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Status</span>
                        <Badge className={getStatusClass(selectedOrder.status)}>
                          {getStatusText(selectedOrder.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium">
                          {formatDateWithYear(selectedOrder.date)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Time</span>
                        <span className="font-medium">
                          {new Date(selectedOrder.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - Rider Details & Order Summary */}
          <div className="space-y-4">
            {/* Rider Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-white">
                <h3 className="font-medium text-base">Rider Details</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-2 border-white shadow">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=rider"
                      alt="Rider"
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">Delivery Agent</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 bg-amber-400 hover:bg-amber-500 text-white border-amber-500"
                    >
                      Track Rider
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base">Order summary</h3>
                  {selectedOrder && (
                    <Badge className={getStatusClass(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {selectedOrder && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order Created</span>
                        <span>
                          {new Date(selectedOrder.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order Time</span>
                        <span>
                          {new Date(selectedOrder.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>${selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span>$0.00</span>
                      </div>
                    </div>
                    <div className="border-t mt-4 pt-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-white">
                <h3 className="font-medium text-base">Delivery Address</h3>
              </CardHeader>
              <CardContent className="p-6">
                {selectedOrder && selectedOrder.address ? (
                  <div className="space-y-2">
                    {selectedOrder.address.line1 && (
                      <div>
                        <span className="text-gray-500">Address line: </span>
                        <span className="font-medium">
                          {selectedOrder.address.line1}
                        </span>
                      </div>
                    )}
                    {selectedOrder.address.line2 && (
                      <div>
                        <span className="text-gray-500">
                          Flat / Building Name:{" "}
                        </span>
                        <span className="font-medium">
                          {selectedOrder.address.line2}
                        </span>
                      </div>
                    )}
                    {selectedOrder.address.city && (
                      <div>
                        <span className="text-gray-500">City: </span>
                        <span className="font-medium">
                          {selectedOrder.address.city}
                        </span>
                      </div>
                    )}
                    {selectedOrder.address.state && (
                      <div>
                        <span className="text-gray-500">State: </span>
                        <span className="font-medium">
                          {selectedOrder.address.state}
                        </span>
                      </div>
                    )}
                    {selectedOrder.address.postalCode && (
                      <div>
                        <span className="text-gray-500">Postcode: </span>
                        <span className="font-medium">
                          {selectedOrder.address.postalCode}
                        </span>
                      </div>
                    )}
                    {selectedOrder.address.country && (
                      <div>
                        <span className="text-gray-500">Country: </span>
                        <span className="font-medium">
                          {selectedOrder.address.country}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No address information available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="w-[48%]"
                    onClick={() =>
                      selectedOrder &&
                      handleStatusChange(selectedOrder.id, "cancelled")
                    }
                  >
                    Cancel Order
                  </Button>
                  <Button
                    className="w-[48%]"
                    onClick={() =>
                      selectedOrder &&
                      handleStatusChange(selectedOrder.id, "delivered")
                    }
                  >
                    Mark Delivered
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveOrders;
