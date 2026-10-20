import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { classifySearch } from "../lib/address";

export function SearchBox() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const target = classifySearch(value);
    if (target.kind === "invalid") {
      setError("Enter a karlsen: address, a transaction id or a block hash.");
      return;
    }
    if (target.kind === "address") {
      navigate(`/addresses/${target.value}`);
      setValue("");
      return;
    }
    // A 64-hex value is either a block hash or a transaction id: try the block first.
    setBusy(true);
    try {
      await api.block(target.value, false);
      navigate(`/blocks/${target.value}`);
      setValue("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        navigate(`/txs/${target.value}`);
        setValue("");
      } else {
        setError("Search failed, the API did not respond. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form role="search" className="search-wrap" onSubmit={onSubmit}>
      <div className="search">
        <label htmlFor="search-input" className="sr-only">
          Search address, transaction or block
        </label>
        <input
          id="search-input"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search address (karlsen:…), transaction id or block hash"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
      <div className="search-error" role="status" aria-live="polite">
        {error}
      </div>
    </form>
  );
}
