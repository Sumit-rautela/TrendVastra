import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
export default function Layout() {
    const { count } = useCart(),
        { user, logout } = useAuth(),
        navigate = useNavigate();
    return (
        <>
        <header className="nav">
            <Link className="brand" to="/">
            Trend<span>Vastra</span>
            </Link>
            <nav>
            <NavLink to="/products">Shop</NavLink>
            <NavLink to="/visual-search">Visual Search</NavLink>
            <NavLink to="/ai-stylist">AI Stylist</NavLink>
            </nav>
            <div className="nav-actions">
                <button
                    className="icon-btn"
                    onClick={() => navigate("/search")}
                    aria-label="Search"
                >
                    <img src="https://img.icons8.com/ios-filled/50/000000/search--v1.png" alt="Search" />
                </button>
                <Link className="cart-link" to="/cart">
                    <img src="https://img.icons8.com/ios-filled/50/000000/shopping-cart.png" alt="Cart" />
                    <b>{count}</b>
                </Link>
                {user ? (
                    <button
                    className="profile-btn"
                    onClick={() => {
                        logout();
                        navigate("/");
                    }}
                    >
                    {user.name?.[0]?.toUpperCase()}
                    </button>
                    ) : (
                    <Link className="login-link" to="/login">
                    <img 
                        src="https://img.icons8.com/ios-filled/50/000000/login-rounded-right.png"
                        alt="Login"
                    />
                    </Link>
                )}
            </div>
        </header>
        <main>
            <Outlet />
        </main>
        <footer>
            <div className="brand">
            Trend<span>Vastra</span>
            </div>
            <p>Fashion discovery, made personal.</p>
            <small>© 2026 TrendVastra · A smarter way to find your style.</small>
        </footer>
        </>
    );
}
