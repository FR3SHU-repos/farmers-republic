import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";
import { ArrowUpRight, PackagePlus, ShoppingBasket, Sprout } from "lucide-react";

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
        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,61,46,0.08)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-50 text-emerald-800">
                        <ShoppingBasket className="h-4 w-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-950">
                            Products
                        </h3>
                        <p className="text-xs text-stone-500">
                            {products.length} listed from this farmer
                        </p>
                    </div>
                </div>

                <Link
                    href="/products/create"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
                >
                    <PackagePlus className="h-4 w-4" />
                    Add product
                </Link>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((prod: Product) => (
                        <Link
                            key={prod._id}
                            href={`/products/${prod._id}`}
                            className="group overflow-hidden rounded-3xl border border-stone-100 bg-stone-50 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                        >
                            <div className="relative h-36 overflow-hidden bg-lime-50">
                                {prod.image ? (
                                    <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(190,242,100,0.42),transparent_32%),linear-gradient(135deg,#f7fee7,#ccfbf1)]">
                                        <Sprout className="h-8 w-8 text-emerald-900" />
                                    </div>
                                )}
                                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-900 shadow-sm transition group-hover:bg-lime-300">
                                    <ArrowUpRight className="h-4 w-4" />
                                </span>
                            </div>

                            <div className="p-4">
                                <div className="truncate text-sm font-semibold text-emerald-950">
                                    {prod.name}
                                </div>

                                {prod.price && (
                                    <div className="mt-2 text-sm font-semibold text-emerald-700">
                                        ₹ {prod.price}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-emerald-900/15 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
                    <p>No products added yet.</p>
                    {user?.type === "Farmer" && (
                        <Link
                            href="/products/create"
                            className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-xs font-semibold text-white"
                        >
                            Add products
                        </Link>
                    )}
                </div>
            )}
        </section>
    );
};

export default FarmerProductCard;
