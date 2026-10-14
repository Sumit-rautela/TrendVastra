import { createContext, useContext, useState } from "react";
const CartContext = createContext();
export const useCart = () => useContext(CartContext);
export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const add = (p) =>
    setItems((x) =>
        x.some((i) => i.id === p.id)
        ? x.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [...x, { ...p, qty: 1 }],
    );
    const remove = (id) => setItems((x) => x.filter((i) => i.id !== id));
    const change = (id, qty) =>
    setItems((x) =>
        x.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
    );
    return (
    <CartContext.Provider
        value={{
        items,
        add,
        remove,
        change,
        count: items.reduce((n, i) => n + i.qty, 0),
        total: items.reduce((n, i) => n + i.price * i.qty, 0),
    }}
    >
    {children}
    </CartContext.Provider>
    );
}
