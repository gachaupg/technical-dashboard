
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { ShoppingBag, Check } from "lucide-react";
import { useProducts } from "@/contexts/ProductContext";

// Cart notification component for live cart updates
const CartNotification = () => {
  // Get cart from context
  const { cart } = useProducts();
  const [prevCartLength, setPrevCartLength] = useState(cart.length);

  useEffect(() => {
    // Skip initial render
    if (prevCartLength === cart.length) return;
    
    // If cart is longer than before, an item was added
    if (cart.length > prevCartLength) {
      const newItem = cart[cart.length - 1];
      
      // Show toast notification with item details
      toast.custom((id) => (
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg animate-in slide-in-from-right-5">
          <div className="h-10 w-10 bg-gray-50 rounded-md flex items-center justify-center">
            {newItem.image ? (
              <img src={newItem.image} alt={newItem.title} className="h-8 w-8 object-contain" />
            ) : (
              <ShoppingBag className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <p className="text-sm font-medium line-clamp-1">{newItem.title}</p>
              <button onClick={() => toast.dismiss(id)} className="text-gray-500 hover:text-gray-800">
                <span className="sr-only">Close</span>
                <Check className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Added to cart</p>
          </div>
        </div>
      ), { duration: 3000 });
    }
    
    // Update the previous cart length
    setPrevCartLength(cart.length);
  }, [cart, prevCartLength]);

  // This component doesn't render anything
  return null;
};

export default CartNotification;
