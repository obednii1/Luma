import Home from "./Home";
import InnerPage from "./Pages";
import { CartProvider } from "./cart";
import { RouterProvider, useRouter } from "./router";

function Routes() {
  const { path } = useRouter();
  return path === "/" || path === "" ? <Home /> : <InnerPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <CartProvider>
        <Routes />
      </CartProvider>
    </RouterProvider>
  );
}
