import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/ProductContext";
import {
  BarChart3,
  Package2,
  ListOrdered,
  ShoppingCart,
  Settings,
  LogOut,
  MessageSquare,
  Search,
  Bell,
  ChevronDown,
  LayoutGrid,
  GanttChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useProducts();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Calculate cart badge count
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Define navigation items
  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      label: "Live Orders",
      path: "/live-orders",
      icon: <BarChart3 className="h-5 w-5" />,
      badge: cart.length ? cart.length : null,
    },
    {
      label: "Order History",
      path: "/orders",
      icon: <ListOrdered className="h-5 w-5" />,
    },
    {
      label: "Offers",
      path: "/offers",
      icon: <GanttChart className="h-5 w-5" />,
    },
    {
      label: "Products",
      path: "/products",
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      label: "Cart",
      path: "/cart",
      icon: <ShoppingCart className="h-5 w-5" />,
      badge: cartItemCount || null,
    },
    {
      label: "Inventory",
      path: "/stock",
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      label: "Messages",
      path: "/message",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="h-screen w-64 fixed left-0 top-0 bg-sidebar flex flex-col">
      <div className="p-4 py-6 flex items-center">
        <Link to="/dashboard" className="font-bold text-xl text-black ml-2">
          Exactconnect
        </Link>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto pb-4">
        {navItems.map((item, index) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-6 py-3 text-gray-600 hover:bg-white",
                isActive && "active-nav-link"
              )}
            >
              {item.icon}
              <span className="ml-3 font-medium">{item.label}</span>
              {item.badge && (
                <div className="ml-auto bg-brand-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600">Busy Mode</span>
          </div>
          <div
            className={cn(
              "w-10 h-5 rounded-full bg-gray-300 flex items-center transition-all",
              false ? "bg-green-500" : ""
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full bg-white shadow transform transition-transform",
                false ? "translate-x-5" : "translate-x-1"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ title }: { title?: string }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get the user avatar image source with correct fallback
  const getAvatarSrc = () => {
    // Try to load from localStorage first (for base64 images)
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) return savedAvatar;

    // Otherwise use the user avatar from auth or a fallback
    return (
      user?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "user"}`
    );
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search..."
            className="pl-10 pr-4 py-1 rounded-full w-64 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Open For Order
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
            2
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="p-1.5 flex items-center space-x-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarSrc()} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user?.name}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
