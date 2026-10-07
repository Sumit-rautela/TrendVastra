import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import {
  Home,
  Products,
  ProductDetails,
  Cart,
  Checkout,
  VisualSearch,
  AIStylist,
  AdminProducts,
  Orders,
  Profile,
  Search,
} from "./pages/StorePages";
import AuthPage from "./pages/AuthPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/visual-search" element={<VisualSearch />} />
        <Route path="/ai-stylist" element={<AIStylist />} />
        <Route path="/admin/products" element={<AdminProducts />} />
      </Route>
    </Routes>
  );
}
