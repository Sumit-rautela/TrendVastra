import ProductCard from "./ProductCard";
export default function ProductRail({ title, eyebrow, products }) {
    return (
        <section className="section">
            <div className="section-title">
                <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h2>{title}</h2>
                </div>
                <a href="/products">View all →</a>
            </div>
            <div className="product-grid">
                {products.map((p) => (
                <ProductCard product={p} key={p.id} />
                ))}
            </div>
        </section>
    );
}
