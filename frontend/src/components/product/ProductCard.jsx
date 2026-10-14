import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
export default function ProductCard({ product }) {
    const { add } = useCart();
    return (
        <article className="product-card">
            <Link to={`/products/${product.id}`}>
                <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <button
                        className="heart"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Save product"
                    >
                        ♡
                    </button>
                </div>
            </Link>
        <div className="product-copy">
            <div className="product-meta">
                <span>{product.category}</span>
                <span>★ {product.rating}</span>
            </div>
            <Link to={`/products/${product.id}`}>
                <h3>{product.name}</h3>
            </Link>
            <div className="product-bottom">
                <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                <button onClick={() => add(product)}>Add +</button>
            </div>
        </div>
    </article>
    );
}
