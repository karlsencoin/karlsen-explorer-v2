import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { NotFound, Placeholder } from "./pages/Placeholder";
import "./styles.css";

// Legacy URLs kept working: /blocks/:id/:txview, /range/<tier>.
function LegacyRange() {
  const { tier } = useParams();
  return <Navigate to={`/distribution/${tier ?? ""}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blocks" element={<Placeholder title="Blocks" />} />
          <Route path="/blocks/:id" element={<Placeholder title="Block" />} />
          <Route path="/blocks/:id/:txview" element={<Placeholder title="Block" />} />
          <Route path="/txs" element={<Placeholder title="Transactions" />} />
          <Route path="/txs/:id" element={<Placeholder title="Transaction" />} />
          <Route path="/addresses/:addr" element={<Placeholder title="Address" />} />
          <Route path="/distribution" element={<Placeholder title="Distribution" />} />
          <Route path="/distribution/:tier" element={<Placeholder title="Distribution range" />} />
          <Route path="/range/:tier" element={<LegacyRange />} />
          <Route path="/bridge" element={<Placeholder title="wKLS Bridge" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
