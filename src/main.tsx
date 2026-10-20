import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AddressPage } from "./pages/AddressPage";
import { BlockPage } from "./pages/BlockPage";
import { Bridge } from "./pages/Bridge";
import { Dashboard } from "./pages/Dashboard";
import { Distribution, DistributionTier } from "./pages/Distribution";
import { BlocksPage, TxsPage } from "./pages/LiveLists";
import { TxPage } from "./pages/TxPage";
import { NotFound } from "./pages/Placeholder";
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
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/blocks/:id" element={<BlockPage />} />
          <Route path="/blocks/:id/:txview" element={<BlockPage />} />
          <Route path="/txs" element={<TxsPage />} />
          <Route path="/txs/:id" element={<TxPage />} />
          <Route path="/addresses/:addr" element={<AddressPage />} />
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/distribution/:tier" element={<DistributionTier />} />
          <Route path="/range/:tier" element={<LegacyRange />} />
          <Route path="/bridge" element={<Bridge />} />
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
