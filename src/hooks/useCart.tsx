import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {


  const [cart, setCart] = useState<Product[]>( () => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      const cart_storage: Product[] = JSON.parse(storagedCart);
      return cart_storage;
    }

    return [];
  });


  const addProduct = async (productId: number) => {

    const toastObject = { error: false, message: "Erro na adição do produto" }

    try {
      
      let newcart;
      const productCart = cart.find(product =>  product.id === productId)
      const { data: current_stock } = await api.get<Stock>(`stock/${productId}`)

      if (productCart ){
        if (current_stock && current_stock.amount <= productCart.amount) {
          
          toastObject.error = true
          toastObject.message = "Quantidade solicitada fora de estoque"

        } else {

          newcart = cart.map(product => {
            return {
              ...product, 
              amount: product.id === productId ? product.amount + 1 : product.amount
            }
          })

          toastObject.message = "Produto adicionado ao carrinho!"

        }

      } else {
        
        const { data : product} = await api.get<Product>(`products/${productId}`)

        if (product){

          if (current_stock && current_stock.amount <= product.amount) {
            toastObject.error = true
            toastObject.message = "Quantidade solicitada fora de estoque"
          } else {
            newcart = [...cart, {...product, amount: 1 }]
            toastObject.message = "Produto adicionado ao carrinho!"
          }
        } else {
          toastObject.error = true
        }
      }

      if ( newcart ) {
        if (toastObject.error === false) {
          setCart(newcart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newcart))
          toast.success(toastObject.message)
        } else {
          toast.error(toastObject.message)
      
        }
        
      } else {
        toast.error(toastObject.message)
    

      }

    } catch {
      toast.error(toastObject.message)
  

    }
  };

  const removeProduct = (productId: number) => {

    const toastObject = { error: false, message: "Erro na remoção do produto" }

    const productCart = cart.find(product =>  product.id === productId)

    try {

      if (productCart) {

        const newcart = cart.filter(product => product.id !== productId)
        setCart(newcart)
        toastObject.message = "Produto removido do carrinho!"
        toast.success(toastObject.message)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newcart))

      } else {
        toast.error(toastObject.message)
      }
      
    } catch {
      toast.error(toastObject.message)
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    const toastObject = { error: false, message: "Erro na alteração de quantidade do produto" }    
    const productCart = cart.find(product =>  product.id === productId)

    try {

      const { data: current_stock } = await api.get<Stock>(`stock/${productId}`)

      if ( productCart && current_stock) {

        if (amount < 1) {

          return;
        }

        if (current_stock.amount >= amount) {
          const newCart = cart.map(cart => { return {
            ...cart, amount: cart.id === productId ? amount : cart.amount
          } })

          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))


        } else {
          toastObject.message = "Quantidade solicitada fora de estoque"
          toast.error(toastObject.message)
        }
      } else {
        toast.error(toastObject.message)
      }

    } catch {
      toast.error(toastObject.message)
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}
