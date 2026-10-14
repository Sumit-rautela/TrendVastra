import { useMemo, useState } from "react";
import {
    Link,
    useParams,
    useSearchParams,
    useNavigate,
    } from "react-router-dom";
    import ProductCard from "../components/product/ProductCard";
    import ProductRail from "../components/product/ProductRail";
    import { products } from "../data/products";
    import { useCart } from "../context/CartContext";
    const chips = ["All", "Women", "Men", "Unisex"];
    export function Home() {
    return (
        <>
        <section className="hero">
            <div>
            <p className="eyebrow">THE EDIT · AUTUMN 2026</p>
            <h1>
                Dress like
                <br />
                <i>yourself.</i>
            </h1>
            <p className="hero-text">
                Thoughtful fashion discovery, powered by a little intelligence and a
                lot of taste.
            </p>
            <div className="hero-actions">
                <Link className="primary transition-colors" to="/products">
                Shop new arrivals
                </Link>
                <Link className="text-link" to="/visual-search">
                Find from an image ↗
                </Link>
            </div>
            </div>
            <div className="hero-visual">
            <img
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85"
                alt="Fashion model in a modern outfit"
            />
            <div className="floating-card">
                <span>✦ AI curated</span>
                <b>Your autumn palette</b>
                <small>Olive · cocoa · cream</small>
            </div>
            </div>
        </section>
        <section className="categories">
            <Link to="/products?category=Women">
            <span>01</span> Women's edit
            </Link>
            <Link to="/products?category=Men">
            <span>02</span> Men's edit
            </Link>
            <Link to="/products?style=Street">
            <span>03</span> Streetwear
            </Link>
            <Link to="/products?style=Evening">
            <span>04</span> Occasion
            </Link>
        </section>
        <ProductRail
            eyebrow="CURATED FOR RIGHT NOW"
            title="Trending this week"
            products={products.slice(0, 4)}
        />
        <section className="ai-banner">
            <div>
            <p className="eyebrow">FASHION, VISUALLY</p>
            <h2>
                Seen it somewhere?
                <br />
                Find it here.
            </h2>
            <p>
                Upload a reference image and let our visual search find the closest
                matches in the catalogue.
            </p>
            <Link className="primary light" to="/visual-search">
                Try visual search
            </Link>
            </div>
            <div className="ai-art">
            ⌁<span>Image → style</span>
            </div>
        </section>
        <ProductRail
            eyebrow="BASED ON YOUR TASTE"
            title="Recommended for you"
            products={products.slice(2)}
        />
        <section className="stylist-promo">
            <p className="eyebrow">YOUR DIGITAL STYLIST</p>
            <h2>
            Not sure what works?
            <br />
            <i>Ask away.</i>
            </h2>
            <Link className="text-link" to="/ai-stylist">
            Meet your AI Stylist →
            </Link>
        </section>
        </>
    );
    }
    export function Products() {
    const [params, setParams] = useSearchParams(),
        [category, setCategory] = useState(params.get("category") || "All"),
        [term, setTerm] = useState("");
    const visible = useMemo(
        () =>
        products.filter(
            (p) =>
            (category === "All" || p.category === category) &&
            (p.name + p.style + p.color)
                .toLowerCase()
                .includes(term.toLowerCase()),
        ),
        [category, term],
    );
    return (
        <section className="catalogue">
        <div className="page-head">
            <p className="eyebrow">THE CATALOGUE</p>
            <h1>Find your next favourite.</h1>
        </div>
        <div className="toolbar">
            <input
            placeholder="Search pieces, colours, styles…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            />
            <select>
            <option>Sort: Featured</option>
            <option>Price: Low to high</option>
            <option>Top rated</option>
            </select>
        </div>
        <div className="filter-row">
            {chips.map((c) => (
            <button
                className={category === c ? "selected" : ""}
                onClick={() => {
                setCategory(c);
                setParams(c === "All" ? {} : { category: c });
                }}
                key={c}
            >
                {c}
            </button>
            ))}
        </div>
        <p className="result-count">{visible.length} pieces selected for you</p>
        <div className="product-grid">
            {visible.map((p) => (
            <ProductCard product={p} key={p.id} />
            ))}
        </div>
        </section>
    );
    }
    export function ProductDetails() {
    const { id } = useParams(),
        product = products.find((p) => p.id === id) || products[0],
        { add } = useCart(),
        [size, setSize] = useState("M");
    return (
        <>
        <section className="detail">
            <div className="detail-image">
            <img src={product.image} alt={product.name} />
            </div>
            <div className="detail-info">
            <p className="eyebrow">
                {product.category} · {product.style}
            </p>
            <h1>{product.name}</h1>
            <p className="price">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="rating">
                ★ {product.rating} · Loved by the TrendVastra community
            </p>
            <p>
                A considered wardrobe essential with an effortless silhouette and a
                soft, elevated finish.
            </p>
            <div>
                <b>Select size</b>
                <div className="sizes">
                {["XS", "S", "M", "L", "XL"].map((s) => (
                    <button
                    className={size === s ? "selected" : ""}
                    onClick={() => setSize(s)}
                    >
                    {s}
                    </button>
                ))}
                </div>
            </div>
            <button
                className="primary full"
                onClick={() => add({ ...product, size })}
            >
                Add to bag · ₹{product.price.toLocaleString("en-IN")}
            </button>
            <p className="detail-note">
                Free delivery on orders over ₹1,999 · Easy 7-day returns
            </p>
            </div>
        </section>
        <ProductRail
            eyebrow="YOU MAY ALSO LIKE"
            title="More in your orbit"
            products={products.filter((p) => p.id !== id).slice(0, 4)}
        />
        </>
    );
    }
    export function Search() {
    const [q, setQ] = useState(""),
        navigate = useNavigate();
    return (
        <section className="simple-page">
        <p className="eyebrow">SEARCH</p>
        <h1>What are you looking for?</h1>
        <form
            className="big-search"
            onSubmit={(e) => {
            e.preventDefault();
            navigate(`/products?search=${q}`);
            }}
        >
            <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “black oversized hoodie”"
            />
            <button className="primary">Search</button>
        </form>
        <p className="muted">
            Popular: linen sets · denim · wedding guest · white sneakers
        </p>
        </section>
    );
    }
    export function Cart() {
    const { items, total, remove, change } = useCart(),
        navigate = useNavigate();
    return (
        <section className="cart-page">
        <div>
            <p className="eyebrow">YOUR BAG</p>
            <h1>
            {items.length
                ? `${items.length} considered piece${items.length > 1 ? "s" : ""}`
                : "Your bag is waiting."}
            </h1>
            {items.length === 0 ? (
            <Link className="primary" to="/products">
                Explore the collection
            </Link>
            ) : (
            items.map((i) => (
                <div className="cart-item">
                <img src={i.image} alt="" />
                <div>
                    <h3>{i.name}</h3>
                    <p>
                    {i.size || "M"} · ₹{i.price.toLocaleString("en-IN")}
                    </p>
                    <div className="qty">
                    <button onClick={() => change(i.id, i.qty - 1)}>−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => change(i.id, i.qty + 1)}>+</button>
                    </div>
                </div>
                <button className="remove" onClick={() => remove(i.id)}>
                    Remove
                </button>
                </div>
            ))
            )}
        </div>
        {items.length > 0 && (
            <aside className="summary">
            <h2>Order summary</h2>
            <p>
                <span>Subtotal</span>
                <b>₹{total.toLocaleString("en-IN")}</b>
            </p>
            <p>
                <span>Shipping</span>
                <b>Free</b>
            </p>
            <hr />
            <p className="summary-total">
                <span>Total</span>
                <b>₹{total.toLocaleString("en-IN")}</b>
            </p>
            <button
                className="primary full"
                onClick={() => navigate("/checkout")}
            >
                Proceed to checkout
            </button>
            </aside>
        )}
        </section>
    );
    }
    export function Checkout() {
    const { total } = useCart();
    return (
        <section className="checkout">
        <div>
            <p className="eyebrow">SECURE CHECKOUT</p>
            <h1>Almost yours.</h1>
            <div className="checkout-card">
            <h2>Delivery details</h2>
            {["Full name", "Phone number", "Address", "City", "PIN code"].map(
                (x) => (
                <input placeholder={x} />
                ),
            )}
            <h2>Payment</h2>
            <label className="payment-option">
                <input type="radio" defaultChecked name="payment" /> Test payment ·
                Razorpay / Stripe
            </label>
            <button className="primary full">
                Place test order · ₹{total.toLocaleString("en-IN")}
            </button>
            </div>
        </div>
        <aside className="summary">
            <h2>Order summary</h2>
            <p>
            <span>Items total</span>
            <b>₹{total.toLocaleString("en-IN")}</b>
            </p>
            <p>
            <span>Delivery</span>
            <b>Free</b>
            </p>
        </aside>
        </section>
    );
    }
    export function VisualSearch() {
    const [file, setFile] = useState(null),
        [searching, setSearching] = useState(false),
        [done, setDone] = useState(false);
    const upload = (e) => {
        setFile(e.target.files?.[0]);
        setDone(false);
    };
    return (
        <section className="visual-page">
        <div>
            <p className="eyebrow">POWERED BY VISUAL SIMILARITY</p>
            <h1>
            Search the way
            <br />
            <i>you see.</i>
            </h1>
            <p>
            Have an outfit saved from somewhere? Upload it. We’ll surface visually
            similar pieces from TrendVastra.
            </p>
        </div>
        <div className="upload-card">
            <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={upload}
            />
            {file ? (
            <>
                <img
                className="preview"
                src={URL.createObjectURL(file)}
                alt="Uploaded reference"
                />
                <button
                className="remove"
                onClick={() => {
                    setFile(null);
                    setDone(false);
                }}
                >
                Remove image
                </button>
            </>
            ) : (
            <label htmlFor="image-upload">
                <span>↑</span>
                <b>Drop an image here</b>
                <small>or browse your files · JPG, PNG, WEBP</small>
            </label>
            )}
            <button
            className="primary full"
            disabled={!file || searching}
            onClick={() => {
                setSearching(true);
                setTimeout(() => {
                setSearching(false);
                setDone(true);
                }, 900);
            }}
            >
            {searching ? "Finding close matches…" : "Find similar styles"}
            </button>
        </div>
        {done && (
            <div className="visual-results">
            <p className="eyebrow">CLOSEST MATCHES</p>
            <h2>Found pieces with a similar visual mood.</h2>
            <div className="product-grid">
                {products.slice(0, 3).map((p) => (
                <ProductCard product={p} key={p.id} />
                ))}
            </div>
            </div>
        )}
        </section>
    );
    }
    export function AIStylist() {
    const [prompt, setPrompt] = useState(""),
        [reply, setReply] = useState(""),
        [loading, setLoading] = useState(false);
    const ask = (e) => {
        e.preventDefault();
        if (!prompt) return;
        setLoading(true);
        setTimeout(() => {
        setReply(
            `For “${prompt}”, I’d pair relaxed tailoring with a clean base layer and one confident accent. Here are pieces from the edit that work beautifully together.`,
        );
        setLoading(false);
        }, 700);
    };
    return (
        <section className="stylist-page">
        <div className="stylist-intro">
            <p className="eyebrow">YOUR PERSONAL AI STYLIST</p>
            <h1>
            What are we
            <br />
            <i>wearing?</i>
            </h1>
            <p>
            Describe the occasion, your mood, or a piece you want to style. We’ll
            turn the thought into an outfit direction.
            </p>
            <div className="suggestions">
            <button onClick={() => setPrompt("A casual outfit for college")}>
                Casual college look
            </button>
            <button
                onClick={() => setPrompt("What to wear to an evening wedding")}
            >
                Wedding guest
            </button>
            <button onClick={() => setPrompt("A minimalist work wardrobe")}>
                Workwear refresh
            </button>
            </div>
        </div>
        <div className="chat-card">
            <div className="chat-message ai">
            Hello! I’m your TrendVastra stylist. Tell me what’s on your calendar.
            </div>
            {reply && <div className="chat-message ai">{reply}</div>}
            <form onSubmit={ask}>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="I need something for…"
            />
            <button className="primary" disabled={loading}>
                {loading ? "Thinking…" : "Ask stylist ↗"}
            </button>
            </form>
        </div>
        {reply && (
            <div className="stylist-products">
            <ProductRail
                eyebrow="THE STYLIST'S PICKS"
                title="Your outfit direction"
                products={products.slice(0, 3)}
            />
            </div>
        )}
        </section>
    );
    }
    export function AdminProducts() {
    const [file, setFile] = useState(null),
        [tags, setTags] = useState(null);
    return (
        <section className="admin-page">
        <p className="eyebrow">ADMIN · PRODUCT INTELLIGENCE</p>
        <h1>Prepare a product for the catalogue.</h1>
        <div className="admin-grid">
            <div className="checkout-card">
            <h2>1. Upload product image</h2>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0])}
            />
            {file && <p className="success">{file.name} ready for tagging</p>}
            <button
                className="primary"
                disabled={!file}
                onClick={() =>
                setTags({ Category: "Jacket", Color: "Black", Style: "Casual" })
                }
            >
                Generate AI tags
            </button>
            </div>
            <div className="checkout-card">
            <h2>2. Review tags</h2>
            {tags ? (
                Object.entries(tags).map(([key, value]) => (
                <label className="tag-field">
                    {key}
                    <input defaultValue={value} />
                </label>
                ))
            ) : (
                <p className="muted">
                Upload an image and generate predictions. Your trained model’s API
                will populate these fields.
                </p>
            )}
            <button className="primary full" disabled={!tags}>
                Save product
            </button>
            </div>
        </div>
        </section>
    );
    }
    export function Orders() {
    return (
        <section className="simple-page">
        <p className="eyebrow">ORDER HISTORY</p>
        <h1>No orders yet.</h1>
        <p className="muted">
            When you find your next favourite, it will appear here.
        </p>
        <Link className="primary" to="/products">
            Browse the collection
        </Link>
        </section>
    );
    }
    export function Profile() {
    return (
        <section className="simple-page">
        <p className="eyebrow">YOUR PROFILE</p>
        <h1>Your style, your space.</h1>
        <div className="checkout-card profile-card">
            <input defaultValue="TrendVastra member" />
            <input placeholder="Email address" />
            <button className="primary">Save changes</button>
        </div>
        </section>
    );
}
