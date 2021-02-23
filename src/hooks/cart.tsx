import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsJSON = await AsyncStorage.getItem('@GoMarketPlace:items');
      if (productsJSON) {
        setProducts(JSON.parse(productsJSON));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productToBeUpdatedIndex = products.findIndex(
        product => product.id === id,
      );

      if (productToBeUpdatedIndex !== -1) {
        const productsUpdated = [...products];
        productsUpdated[productToBeUpdatedIndex].quantity += 1;
        setProducts(productsUpdated);
        await AsyncStorage.setItem(
          '@GoMarketPlace:items',
          JSON.stringify(productsUpdated),
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const hasProductInCart = products.find(
        productItem => productItem.id === product.id,
      );
      if (hasProductInCart) {
        increment(hasProductInCart.id);
      } else {
        const productsUpdated = [...products, { ...product, quantity: 1 }];
        setProducts(productsUpdated);
        await AsyncStorage.setItem(
          '@GoMarketPlace:items',
          JSON.stringify(productsUpdated),
        );
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const productToBeUpdatedIndex = products.findIndex(
        product => product.id === id,
      );

      if (productToBeUpdatedIndex !== -1) {
        let productsUpdated;
        if (products[productToBeUpdatedIndex].quantity === 1) {
          productsUpdated = products.filter(product => product.id !== id);
          setProducts(productsUpdated);
          await AsyncStorage.setItem(
            '@GoMarketPlace:items',
            JSON.stringify(productsUpdated),
          );
        } else {
          productsUpdated = [...products];
          productsUpdated[productToBeUpdatedIndex].quantity -= 1;
          setProducts(productsUpdated);
          await AsyncStorage.setItem(
            '@GoMarketPlace:items',
            JSON.stringify(productsUpdated),
          );
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
