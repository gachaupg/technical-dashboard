import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import {
  saveOrder,
  getUserOrders,
  updateOrderStatus,
  saveOrderWithBatch,
  subscribeToUserOrders,
} from "@/lib/firestore";

// Constants
const ORDERS_COLLECTION = "orders";

// Define product type
export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

// Define order item type
export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  title: string;
  image: string;
}

// Define order type
export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  paymentMethod?: string;
  userId?: string;
}

// Define cart item type
export interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  title: string;
  image: string;
}

// Define the customer info type for order placement
interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
}

// Define context type
interface ProductContextType {
  products: Product[];
  filteredProducts: Product[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  cart: CartItem[];
  orders: Order[];
  selectedCategory: string;
  searchQuery: string;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (customerInfo: CustomerInfo) => Promise<string>;
  filterProducts: (category: string, search: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  refreshOrders: () => Promise<void>;
  updateOrderStatusLocal: (
    orderId: string,
    status: "processing" | "shipped" | "delivered" | "cancelled"
  ) => Promise<void>;
}

// Create context
const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch products on initial load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://fakestoreapi.com/products");
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);

        // Extract unique categories
        const uniqueCategories = [
          "all",
          ...new Set(data.map((product: Product) => product.category)),
        ];
        setCategories(uniqueCategories as string[]);

        setIsLoading(false);
      } catch (err) {
        setError("Failed to fetch products");
        setIsLoading(false);
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();

    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Load orders from localStorage if user is logged in
    if (user) {
      try {
        const savedOrders = localStorage.getItem(ORDERS_COLLECTION);
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          // Filter by user ID to ensure we only show this user's orders
          const userOrders = parsedOrders.filter(
            (order) => order.userId === user.id
          );
          console.log("Loaded orders from localStorage:", userOrders.length);
          if (userOrders.length > 0) {
            setOrders(userOrders);
          }
        }
      } catch (err) {
        console.error("Error loading orders from localStorage:", err);
      }
    }
  }, [user]);

  // Subscription to orders
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user) {
      console.log("Setting up orders subscription for user:", user.id);

      // Subscribe to orders updates
      unsubscribe = subscribeToUserOrders(user.id, (userOrders) => {
        if (userOrders.length > 0) {
          console.log(
            `Received ${userOrders.length} orders from Firestore subscription`
          );

          // Make sure all orders have userId (should already have it, but just in case)
          const ordersWithUserId = userOrders.map((order) => {
            if (!order.userId) {
              return { ...order, userId: user.id };
            }
            return order;
          });

          // Update the orders state
          setOrders(ordersWithUserId);
        }
      });
    }

    return () => {
      // Clean up subscription when component unmounts or user changes
      if (unsubscribe) {
        console.log("Cleaning up orders subscription");
        unsubscribe();
      }
    };
  }, [user]);

  // Load orders from localStorage if user is logged in but no Firestore connection
  useEffect(() => {
    if (user && orders.length === 0) {
      try {
        const savedOrders = localStorage.getItem(ORDERS_COLLECTION);
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          // Filter by user ID to ensure we only show this user's orders
          const userOrders = parsedOrders.filter(
            (order) => order.userId === user.id
          );
          console.log("Loaded orders from localStorage:", userOrders.length);
          if (userOrders.length > 0) {
            setOrders(userOrders);
          }
        }
      } catch (err) {
        console.error("Error loading orders from localStorage:", err);
      }
    }
  }, [user, orders.length]);

  // Fetch user orders from Firestore
  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userOrders = await getUserOrders(user.id);

      // If we got orders from Firestore, update state and localStorage
      if (userOrders && userOrders.length > 0) {
        console.log(`Got ${userOrders.length} orders from Firestore/API`);

        // Make sure all orders have userId
        const ordersWithUserId = userOrders.map((order) => {
          if (!order.userId) {
            return { ...order, userId: user.id };
          }
          return order;
        });

        // Set the orders state
        setOrders(ordersWithUserId);

        // Save to localStorage as backup
        localStorage.setItem(
          ORDERS_COLLECTION,
          JSON.stringify(ordersWithUserId)
        );
      } else {
        // If no orders from API, try localStorage
        const savedOrders = localStorage.getItem(ORDERS_COLLECTION);
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            // Filter by user ID
            const userOrders = parsedOrders.filter(
              (order: Order) => order.userId === user.id
            );
            console.log(
              `Got ${userOrders.length} orders from localStorage fallback`
            );
            if (userOrders.length > 0) {
              setOrders(userOrders);
            }
          } catch (parseErr) {
            console.error("Error parsing saved orders:", parseErr);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load your orders");

      // Try to load from localStorage as fallback
      try {
        const savedOrders = localStorage.getItem(ORDERS_COLLECTION);
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          // Filter by user ID
          const userOrders = parsedOrders.filter(
            (order: Order) => order.userId === user.id
          );
          console.log(
            `Got ${userOrders.length} orders from localStorage (error fallback)`
          );
          if (userOrders.length > 0) {
            setOrders(userOrders);
          }
        }
      } catch (parseErr) {
        console.error("Error parsing saved orders:", parseErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh orders manually
  const refreshOrders = async () => {
    return fetchUserOrders();
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Save orders to localStorage as fallback
  useEffect(() => {
    if (user && orders.length > 0) {
      // Make sure all orders have userId
      const ordersWithUserId = orders.map((order) => {
        if (!order.userId && user) {
          return { ...order, userId: user.id };
        }
        return order;
      });

      // Save orders to localStorage
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(ordersWithUserId));
    }
  }, [orders, user]);

  // Filter products based on category and search query
  const filterProducts = (category: string, search: string) => {
    let filtered = [...products];

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter((product) => product.category === category);
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(filtered);
  };

  // Update filters when category or search changes
  useEffect(() => {
    filterProducts(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, products]);

  // Add product to cart and create both a regular order and a live order automatically
  const addToCart = async (product: Product, quantity = 1) => {
    // Update cart state first
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );

      let updatedCart;
      if (existingItem) {
        // Update quantity of existing item
        updatedCart = prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        updatedCart = [
          ...prevCart,
          {
            productId: product.id,
            quantity,
            price: product.price,
            title: product.title,
            image: product.image,
          },
        ];
      }

      // Save cart to localStorage
      localStorage.setItem("cart", JSON.stringify(updatedCart));

      return updatedCart;
    });

    toast.success(`Added ${product.title} to cart`);
  };

  // Create both a regular order and a live order from the current cart
  const createOrdersFromCart = async (
    currentCart: CartItem[],
    productTitle: string
  ) => {
    if (!user) {
      console.log("User not logged in, cannot create orders");
      return;
    }

    try {
      const total = currentCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Create basic info for orders
      const orderData: Omit<Order, "id"> = {
        items: [...currentCart],
        total,
        date: new Date().toISOString(),
        customerName: user.name || "Customer",
        customerEmail: user.email,
        customerPhone: user.phone,
        address: {}, // Empty address for auto-generated order
        status: "processing" as const,
        userId: user.id,
      };

      // Create live order (processing status)
      const liveOrder: Order = {
        ...orderData,
        id: `order-${Date.now()}-live`,
        status: "processing",
      };

      // Create regular order (shipped status)
      const regularOrder: Order = {
        ...orderData,
        id: `order-${Date.now()}-regular`,
        status: "shipped",
      };

      // Save orders to Firestore using batch for consistency
      const liveOrderId = await saveOrderWithBatch(liveOrder, user.id, false);
      const regularOrderId = await saveOrderWithBatch(
        regularOrder,
        user.id,
        false
      );

      // Update the orders with the Firestore IDs
      liveOrder.id = liveOrderId;
      regularOrder.id = regularOrderId;

      // Add to local state
      const updatedOrders = [...orders, liveOrder, regularOrder];
      setOrders(updatedOrders);

      // Save to localStorage
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(updatedOrders));

      // Show toast notifications
      toast.success(`Live order created for ${productTitle}`);
      toast.success(
        `Order #${regularOrderId.substring(
          regularOrderId.length - 6
        )} placed for ${productTitle}`
      );

      return { liveOrderId, regularOrderId };
    } catch (error) {
      console.error("Error creating orders:", error);
      toast.error("Failed to create orders");
      return null;
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: number) => {
    // Get product title before removing
    const item = cart.find((item) => item.productId === productId);
    const productTitle = item ? item.title : "Product";

    // Remove from cart
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );

    // Find corresponding orders for this product
    const processingOrder = orders.find(
      (order) =>
        order.status === "processing" &&
        order.items.some((item) => item.productId === productId)
    );

    const shippedOrder = orders.find(
      (order) =>
        order.status === "shipped" &&
        order.items.some((item) => item.productId === productId)
    );

    // Handle processing (live) order
    if (processingOrder) {
      // Update the order to remove this item
      const updatedItems = processingOrder.items.filter(
        (item) => item.productId !== productId
      );

      if (updatedItems.length === 0) {
        // If no items left, cancel the order
        await updateOrderStatusLocal(processingOrder.id, "cancelled");
        toast.info(`Live order for ${productTitle} has been cancelled`);
      } else {
        // Calculate new total
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Update the order with new items and total
        try {
          // Update local orders state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === processingOrder.id
                ? { ...order, items: updatedItems, total: newTotal }
                : order
            )
          );

          toast.info(`Live order updated after removing ${productTitle}`);
        } catch (error) {
          console.error("Error updating live order:", error);
        }
      }
    }

    // Handle shipped (regular) order
    if (shippedOrder) {
      // Update the order to remove this item
      const updatedItems = shippedOrder.items.filter(
        (item) => item.productId !== productId
      );

      if (updatedItems.length === 0) {
        // If no items left, cancel the order
        await updateOrderStatusLocal(shippedOrder.id, "cancelled");
        toast.info(`Order for ${productTitle} has been cancelled`);
      } else {
        // Calculate new total
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Update the order with new items and total
        try {
          // Update local orders state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === shippedOrder.id
                ? { ...order, items: updatedItems, total: newTotal }
                : order
            )
          );

          toast.info(`Order updated after removing ${productTitle}`);
        } catch (error) {
          console.error("Error updating order:", error);
        }
      }
    }

    toast.success("Item removed from cart");
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (
    productId: number,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Get product info before updating
    const item = cart.find((item) => item.productId === productId);
    if (!item) return;

    // Update cart
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );

    // Find corresponding orders
    const processingOrder = orders.find(
      (order) =>
        order.status === "processing" &&
        order.items.some((item) => item.productId === productId)
    );

    const shippedOrder = orders.find(
      (order) =>
        order.status === "shipped" &&
        order.items.some((item) => item.productId === productId)
    );

    // Update live order if exists
    if (processingOrder) {
      // Update the order with new quantity for this item
      const updatedItems = processingOrder.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );

      // Calculate new total
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      try {
        // Update local orders state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === processingOrder.id
              ? { ...order, items: updatedItems, total: newTotal }
              : order
          )
        );

        toast.info(`Live order updated for ${item.title}`, {
          duration: 2000,
          position: "bottom-right",
        });
      } catch (error) {
        console.error("Error updating live order:", error);
      }
    }

    // Update shipped order if exists
    if (shippedOrder) {
      // Update the order with new quantity for this item
      const updatedItems = shippedOrder.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );

      // Calculate new total
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      try {
        // Update local orders state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === shippedOrder.id
              ? { ...order, items: updatedItems, total: newTotal }
              : order
          )
        );

        toast.info(`Order updated for ${item.title}`, {
          duration: 2000,
          position: "bottom-right",
        });
      } catch (error) {
        console.error("Error updating order:", error);
      }
    }
  };

  // Clear cart and cancel corresponding orders
  const clearCart = async () => {
    // Before clearing, find all relevant orders
    const processingOrders = orders.filter(
      (order) => order.status === "processing"
    );
    const shippedOrders = orders.filter(
      (order) =>
        order.status === "shipped" && (!order.address || !order.address.line1)
    );

    // Clear the cart first
    setCart([]);

    // Create a copy of orders to track cancellations
    let updatedOrders = [...orders];

    // Cancel all processing (live) orders
    for (const order of processingOrders) {
      try {
        // Update the order status in our local copy
        updatedOrders = updatedOrders.map((o) =>
          o.id === order.id ? { ...o, status: "cancelled" as const } : o
        );

        // Also try to update in backend
        await updateOrderStatus(order.id, "cancelled");
      } catch (error) {
        console.error(`Error cancelling processing order ${order.id}:`, error);
      }
    }

    // Cancel all shipped orders that were auto-generated (without complete address)
    for (const order of shippedOrders) {
      try {
        // Update the order status in our local copy
        updatedOrders = updatedOrders.map((o) =>
          o.id === order.id ? { ...o, status: "cancelled" as const } : o
        );

        // Also try to update in backend
        await updateOrderStatus(order.id, "cancelled");
      } catch (error) {
        console.error(`Error cancelling shipped order ${order.id}:`, error);
      }
    }

    // Update our orders state with the cancelled orders
    setOrders(updatedOrders);

    const totalCancelled = processingOrders.length + shippedOrders.length;
    if (totalCancelled > 0) {
      toast.info(`${totalCancelled} order(s) have been cancelled`);
    }
  };

  // Update order status in Firestore and local state
  const updateOrderStatusLocal = async (
    orderId: string,
    status: "processing" | "shipped" | "delivered" | "cancelled"
  ) => {
    try {
      await updateOrderStatus(orderId, status);

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Place order
  const placeOrder = async (customerInfo: CustomerInfo): Promise<string> => {
    if (!user) {
      toast.error("You must be logged in to place an order");
      return "";
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return "";
    }

    try {
      const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const newOrder: Order = {
        id: `order-${Date.now()}`, // Temporary ID, will be replaced by Firestore
        items: [...cart],
        total,
        date: new Date().toISOString(),
        status: "processing",
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        address: customerInfo.address,
        userId: user.id, // Include user ID directly in the order
      };

      // Save order to Firestore using batch operation for consistency
      const orderId = await saveOrderWithBatch(newOrder, user.id, true);

      // Update the order with the Firestore ID
      newOrder.id = orderId;

      // For localStorage persistence, explicitly add userId to order
      const orderWithUserId = {
        ...newOrder,
        userId: user.id, // Important: Add userId for localStorage filtering
      };

      // Add to local state first with userId
      setOrders((prevOrders) => [...prevOrders, orderWithUserId]);

      // Clear cart after ensuring order is saved
      setCart([]);
      localStorage.setItem("cart", JSON.stringify([]));

      toast.success("Order placed successfully!");

      // Fetch updated orders to ensure consistency with Firebase
      refreshOrders();

      return orderId;
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
      return "";
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        filteredProducts,
        categories,
        isLoading,
        error,
        cart,
        orders,
        selectedCategory,
        searchQuery,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        placeOrder,
        filterProducts,
        setSearchQuery,
        setSelectedCategory,
        refreshOrders,
        updateOrderStatusLocal,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook to use product context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
