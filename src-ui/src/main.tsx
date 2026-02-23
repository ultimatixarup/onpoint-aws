import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/AppRouter";
import { Providers } from "./app/Providers";
import "./styles/global.css";
import "./styles/theme.css";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Providers>
    <AppRouter />
  </Providers>,
);
