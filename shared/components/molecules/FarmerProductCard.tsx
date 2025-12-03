import { useUser } from "@/shared/context/UserContext";
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
    const { user } = useUser();

    return (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-stone-200">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-900">
                    Products
                </h3>

                <Link
                    href="/products/create"
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-all shadow-sm"
                >
                    + Add Product
                </Link>
            </div>

            {/* Products List */}
            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((prod: Product) => (
                        <Link
                            key={prod._id}
                            href={`/products/${prod._id}`}
                            className="group bg-stone-50 border rounded-xl p-3 shadow-sm hover:shadow-md hover:bg-stone-100 transition-all"
                        >
                            {/* Product Image */}
                            <div className="w-full h-28 bg-white rounded-lg overflow-hidden shadow-sm">
                                {prod.image ? (
                                    <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full text-xs text-stone-400 flex items-center justify-center">
                                        No image
                                    </div>
                                )}
                            </div>

                            {/* Product Name */}
                            <div className="mt-2 text-sm font-semibold text-stone-900 truncate">
                                {prod.name}
                            </div>

                            {/* Price */}
                            {prod.price && (
                                <div className="text-xs text-green-600 font-medium mt-1">
                                    ₹ {prod.price}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-stone-500 text-sm py-6 text-center">
                    No products added yet.
                    {user?.type === "Farmer" && (
                        <Link
                            href="/products/create"
                            className="text-green-600 underline ml-1"
                        >
                            Add Products
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default FarmerProductCard;
