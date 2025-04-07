
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ShoppingBag,
  Clock,
  ArrowRight,
  CheckCircle,
  Truck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { orders, products } = useProducts();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalSpent: 0,
    pendingOrders: 0,
  });

  // Calculate dashboard stats
  useEffect(() => {
    setStats({
      totalOrders: orders.length,
      totalProducts: products.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: orders.filter(order => order.status === 'processing').length,
    });
  }, [orders, products]);

  // Get most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Helper function to render status pill
  const renderStatusPill = (status: string) => {
    const statusMap = {
      'processing': { class: 'status-processing', text: 'Processing' },
      'shipped': { class: 'status-on-the-way', text: 'On The Way' },
      'delivered': { class: 'status-delivered', text: 'Delivered' },
      'cancelled': { class: 'status-cancelled', text: 'Cancelled' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: '', text: status };
    
    return (
      <div className={cn("status-pill", statusInfo.class)}>
        {statusInfo.text}
      </div>
    );
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid gap-6">
        {/* Welcome Card */}
        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back, {user?.name}</CardTitle>
            <p className="text-gray-500">
              Here's what's happening with your orders today.
            </p>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-highlight">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-green-600 mt-1">
                +2% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-highlight">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Orders</CardTitle>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.pendingOrders > 0 
                  ? "Orders awaiting processing" 
                  : "All orders fulfilled"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-highlight">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-gray-500 mt-1">
                Available in store
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-highlight">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-green-600 mt-1">
                +5% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="card-highlight">
          <CardHeader className="flex flex-row justify-between items-center border-b">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" className="text-sm flex items-center gap-1 text-gray-500 hover:text-gray-900">
                View All <ArrowRight size={16} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link to={`/orders/${order.id}`} className="text-brand-highlight hover:underline">
                          #{order.id.substring(order.id.length - 6)}
                        </Link>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {renderStatusPill(order.status)}
                      </TableCell>
                      <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                      <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No orders yet</p>
                <Link to="/products">
                  <Button className="mt-2">Browse Products</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
