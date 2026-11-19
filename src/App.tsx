import Home from "./Home";
import InnerPage from "./Pages";
import { CartProvider } from "./cart";
import { ProductsProvider } from "./products";
import { WishlistProvider } from "./wishlist";
import { RouterProvider, useRouter } from "./router";

function Routes() {
  const { path } = useRouter();
  return path === "/" || path === "" ? <Home /> : <InnerPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <ProductsProvider>
        <WishlistProvider>
          <CartProvider>
            <Routes />
          </CartProvider>
        </WishlistProvider>
      </ProductsProvider>
    </RouterProvider>
  );
}
