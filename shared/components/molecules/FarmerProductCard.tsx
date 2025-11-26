// This is the productcard for displaying individual products of a farmer

// shared/components/molecules/FarmerProductCard.tsx
import Link from "next/link";

interface Product {
    _id: string;
    name: string;
    price?: number;
    image?: string;
}

interface FarmerProductCardProps {
    products: Product[];
}

const FarmerProductCard = ({ products }: FarmerProductCardProps) => {
    return (
        <>
            {/* Products Section */}
            {products.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h3 className="font-semibold text-stone-800 mb-3">Products</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {products.map((prod: Product) => (
                            <Link href={`/products/${prod._id}`}
                                key={prod._id}
                                className="border rounded-xl p-3 shadow-sm hover:shadow transition bg-stone-50"
                            >
                                <div className="text-sm font-semibold text-stone-900">
                                    {prod.name}
                                </div>

                                {prod.price && (
                                    <div className="text-xs text-stone-500 mt-1">₹ {prod.price}</div>
                                )}

                                {prod.image && (
                                    <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-full h-28 object-cover rounded-lg mt-2"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {products.length === 0 && (
                <div className="bg-white p-3 rounded-xl shadow-sm text-sm text-stone-400">
                    No products added for this farmer.
                </div>
            )}
        </>
    );
};
  
export default FarmerProductCard;