import { db } from "./firebase";
import {
  collection as firestoreCollection,
  addDoc,
  getDocs,
  query as firestoreQuery,
  where as firestoreWhere,
  doc as firestoreDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy as firestoreOrderBy,
  Timestamp,
  writeBatch,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { Order, Product } from "@/contexts/ProductContext";

const ORDERS_COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";

// Helper for timestamp conversion
const createTimestamp = (date: Date) => {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  };
};

// Helper to simulate collection
const simulateCollection = (dbInstance: any, collectionName: string) => {
  return (
    dbInstance.collection?.(collectionName) || {
      add: async () => ({}),
    }
  );
};

// Helper to simulate document
const simulateDoc = (
  dbInstance: any,
  collectionName: string,
  docId: string
) => {
  return (
    dbInstance.collection?.(collectionName)?.doc?.(docId) || {
      get: async () => ({}),
      update: async () => ({}),
    }
  );
};

// Helper to simulate query
const simulateQuery = (collectionRef: any, ...conditions: any[]) => {
  return collectionRef;
};

// Helper to simulate where condition
const simulateWhere = (field: string, operator: string, value: any) => {
  return { field, operator, value };
};

// Helper to simulate orderBy
const simulateOrderBy = (field: string, direction: string) => {
  return { field, direction };
};

// Orders management
export const saveOrder = async (
  order: Order,
  userId: string
): Promise<string> => {
  try {
    const now = new Date();
    const orderData = {
      ...order,
      userId,
      date: createTimestamp(new Date(order.date)),
      createdAt: createTimestamp(now),
    };

    const docRef = await addDoc(
      firestoreCollection(db, ORDERS_COLLECTION),
      orderData
    );

    // Also store in localStorage with userId for persistence
    try {
      const savedOrders = localStorage.getItem(ORDERS_COLLECTION) || "[]";
      const parsedOrders = JSON.parse(savedOrders);

      // Create localStorage-friendly version (with userId)
      const orderWithUserId = {
        ...order,
        id: docRef.id,
        userId,
        date:
          typeof order.date === "string"
            ? order.date
            : new Date().toISOString(),
      };

      // Add to localStorage orders
      parsedOrders.push(orderWithUserId);
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(parsedOrders));
    } catch (e) {
      console.error("Error saving order to localStorage:", e);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error saving order:", error);

    // Even if Firestore fails, try to save to localStorage
    try {
      const tempId = `order-${Date.now()}`;
      const savedOrders = localStorage.getItem(ORDERS_COLLECTION) || "[]";
      const parsedOrders = JSON.parse(savedOrders);

      // Create localStorage-friendly version
      const orderWithUserId = {
        ...order,
        id: tempId,
        userId,
        date:
          typeof order.date === "string"
            ? order.date
            : new Date().toISOString(),
      };

      parsedOrders.push(orderWithUserId);
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(parsedOrders));

      return tempId;
    } catch (e) {
      console.error("Error saving to localStorage fallback:", e);
      return `order-${Date.now()}`;
    }
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    // Try to get data from localStorage for demo purposes or if Firebase fails
    let localOrders: Order[] = [];
    const cachedOrders = localStorage.getItem(ORDERS_COLLECTION);

    if (cachedOrders) {
      try {
        const parsed = JSON.parse(cachedOrders);
        if (Array.isArray(parsed)) {
          localOrders = parsed.filter((order) => order.userId === userId);
        }
      } catch (e) {
        console.error("Error parsing cached orders:", e);
      }
    }

    // Try to get from Firestore
    const ordersCollection = firestoreCollection(db, ORDERS_COLLECTION);
    const ordersQuery = firestoreQuery(
      ordersCollection,
      firestoreWhere("userId", "==", userId),
      firestoreOrderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(ordersQuery);

    const firestoreOrders: Order[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() || {};
      firestoreOrders.push({
        id: doc.id,
        items: data.items || [],
        total: data.total || 0,
        date:
          typeof data.date === "string" ? data.date : new Date().toISOString(),
        status: data.status || "processing",
        customerName: data.customerName || "Customer",
        customerEmail: data.customerEmail || "customer@example.com",
        customerPhone: data.customerPhone,
        address: data.address || {},
        paymentMethod: data.paymentMethod,
      });
    });

    // If we got Firestore orders, return those. Otherwise, use localStorage orders
    if (firestoreOrders.length > 0) {
      // Also update localStorage with these orders for backup
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(firestoreOrders));
      return firestoreOrders;
    }

    return localOrders;
  } catch (error) {
    console.error("Error fetching user orders:", error);

    // Try to return localStorage data as a last resort
    try {
      const cachedOrders = localStorage.getItem(ORDERS_COLLECTION);
      if (cachedOrders) {
        const parsed = JSON.parse(cachedOrders);
        if (Array.isArray(parsed)) {
          return parsed.filter((order) => order.userId === userId);
        }
      }
    } catch (e) {
      console.error("Error using localStorage fallback:", e);
    }

    return [];
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = firestoreDoc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        items: data.items || [],
        total: data.total || 0,
        date:
          typeof data.date === "string" ? data.date : new Date().toISOString(),
        status: data.status || "processing",
        customerName: data.customerName || "Customer",
        customerEmail: data.customerEmail || "customer@example.com",
        customerPhone: data.customerPhone,
        address: data.address,
        paymentMethod: data.paymentMethod,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<void> => {
  try {
    const docRef = firestoreDoc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error updating order status:", error);
  }
};

// Product saving for admin purposes
export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    for (const product of products) {
      await addDoc(firestoreCollection(db, PRODUCTS_COLLECTION), product);
    }
  } catch (error) {
    console.error("Error saving products:", error);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(
      firestoreCollection(db, PRODUCTS_COLLECTION)
    );
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      products.push(doc.data() as Product);
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Orders management with batch operation for consistency
export const saveOrderWithBatch = async (
  order: Order,
  userId: string,
  clearCartItems = true
): Promise<string> => {
  try {
    const now = new Date();
    const orderData = {
      ...order,
      userId,
      date: createTimestamp(new Date(order.date)),
      createdAt: createTimestamp(now),
    };

    // Create a batch operation for atomicity
    const batch = writeBatch(db);

    // Generate a document reference with a random ID
    const orderDocRef = firestoreDoc(
      firestoreCollection(db, ORDERS_COLLECTION)
    );

    // Set the order data in the batch
    batch.set(orderDocRef, orderData);

    // If we need to clear cart, we could add that to batch too
    if (clearCartItems && userId) {
      // We could add more operations here if needed, like updating user's order history
      // or decrementing inventory counts, etc.
      const userCartRef = firestoreDoc(db, "userCarts", userId);
      batch.set(userCartRef, { items: [], updatedAt: createTimestamp(now) });
    }

    // Commit the batch
    await batch.commit();

    // Create localStorage-friendly version (with userId)
    const orderWithUserId = {
      ...order,
      id: orderDocRef.id,
      userId,
      date:
        typeof order.date === "string" ? order.date : new Date().toISOString(),
    };

    // Update localStorage for offline access
    try {
      const savedOrders = localStorage.getItem(ORDERS_COLLECTION) || "[]";
      const parsedOrders = JSON.parse(savedOrders);
      parsedOrders.push(orderWithUserId);
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(parsedOrders));
    } catch (e) {
      console.error("Error saving order to localStorage:", e);
    }

    return orderDocRef.id;
  } catch (error) {
    console.error("Error in batch saving order:", error);

    // Fallback to localStorage if Firebase fails
    try {
      const tempId = `order-${Date.now()}`;
      const savedOrders = localStorage.getItem(ORDERS_COLLECTION) || "[]";
      const parsedOrders = JSON.parse(savedOrders);

      // Create localStorage-friendly version
      const orderWithUserId = {
        ...order,
        id: tempId,
        userId,
        date:
          typeof order.date === "string"
            ? order.date
            : new Date().toISOString(),
      };

      parsedOrders.push(orderWithUserId);
      localStorage.setItem(ORDERS_COLLECTION, JSON.stringify(parsedOrders));

      return tempId;
    } catch (e) {
      console.error("Error saving to localStorage fallback:", e);
      return `order-${Date.now()}`;
    }
  }
};

// Subscribe to user orders with real-time updates
export const subscribeToUserOrders = (
  userId: string,
  callback: (orders: Order[]) => void
) => {
  // Create a query against the orders collection for this user
  const ordersCollection = firestoreCollection(db, ORDERS_COLLECTION);
  const ordersQuery = firestoreQuery(
    ordersCollection,
    firestoreWhere("userId", "==", userId),
    firestoreOrderBy("createdAt", "desc")
  );

  // Return the unsubscribe function
  return onSnapshot(
    ordersQuery,
    (querySnapshot) => {
      const firestoreOrders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() || {};
        // Convert Firestore timestamps to ISO strings
        const date =
          data.date && typeof data.date.toDate === "function"
            ? data.date.toDate().toISOString()
            : new Date().toISOString();

        const createdAt =
          data.createdAt && typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();

        firestoreOrders.push({
          id: doc.id,
          items: data.items || [],
          total: data.total || 0,
          date: date,
          status: data.status || "processing",
          customerName: data.customerName || "Customer",
          customerEmail: data.customerEmail || "customer@example.com",
          customerPhone: data.customerPhone,
          address: data.address || {},
          paymentMethod: data.paymentMethod,
          userId: data.userId,
        });
      });

      // Also save to localStorage for persistence
      try {
        localStorage.setItem(
          ORDERS_COLLECTION,
          JSON.stringify(firestoreOrders)
        );
      } catch (e) {
        console.error("Error saving orders to localStorage:", e);
      }

      // Call the callback with the orders
      callback(firestoreOrders);
    },
    (error) => {
      console.error("Error getting real-time order updates:", error);

      // Try to get orders from localStorage as a fallback
      try {
        const savedOrders = localStorage.getItem(ORDERS_COLLECTION);
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          const userOrders = parsedOrders.filter(
            (order: Order) => order.userId === userId
          );
          callback(userOrders);
        }
      } catch (e) {
        console.error("Error getting orders from localStorage:", e);
        callback([]);
      }
    }
  );
};

// Function to simulate real-time order updates for demo purposes
export const simulateOrderUpdates = (userId: string) => {
  const ordersKey = ORDERS_COLLECTION;
  const savedOrders = localStorage.getItem(ordersKey) || "[]";

  try {
    const parsedOrders = JSON.parse(savedOrders);
    // Ensure we have a valid array
    if (!Array.isArray(parsedOrders)) return;

    // Get this user's orders
    const userOrders = parsedOrders.filter((order) => order.userId === userId);

    // If we have any "processing" orders, simulate status changes
    const processingOrders = userOrders.filter(
      (order) => order.status === "processing"
    );

    if (processingOrders.length > 0) {
      // Pick a random processing order to update
      const randomIndex = Math.floor(Math.random() * processingOrders.length);
      const orderToUpdate = processingOrders[randomIndex];

      // Update the status (alternate between different statuses)
      const newStatus = getNextStatus(orderToUpdate.status);
      orderToUpdate.status = newStatus;

      // Find the order in the full orders array and update it
      const fullIndex = parsedOrders.findIndex(
        (order) => order.id === orderToUpdate.id
      );
      if (fullIndex !== -1) {
        parsedOrders[fullIndex] = orderToUpdate;

        // Save back to localStorage
        localStorage.setItem(ordersKey, JSON.stringify(parsedOrders));

        // If we're using the real Firestore, update it there too
        try {
          const docRef = firestoreDoc(db, ORDERS_COLLECTION, orderToUpdate.id);
          updateDoc(docRef, { status: newStatus });
        } catch (e) {
          console.log("Error updating Firestore (expected in mock mode):", e);
        }

        console.log(
          `Simulated order status update: ${orderToUpdate.id} -> ${newStatus}`
        );
      }
    }
  } catch (e) {
    console.error("Error simulating order updates:", e);
  }
};

// Helper function to determine the next status in the cycle
const getNextStatus = (
  currentStatus: string
): "processing" | "shipped" | "delivered" | "cancelled" => {
  switch (currentStatus) {
    case "processing":
      return "shipped";
    case "shipped":
      return "delivered";
    case "delivered":
      return "processing"; // Loop back to processing for demo
    case "cancelled":
      return "processing";
    default:
      return "processing";
  }
};
