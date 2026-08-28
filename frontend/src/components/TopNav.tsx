import type { MouseEvent } from "react";
import { LocalStorageSvc } from "../services/LocalStorageSvc";
import { useAppStore } from "../store/useAppStore";
import "./TopNav.scss";

function TopNav() {
  const setCode = useAppStore((state) => state.setCode);
  const basePath = "/mb";

  function handleClear(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    LocalStorageSvc.setCode("");
    setCode("");
  }

  return (
    <div className="top-nav__container">
      <a href={basePath}>Home</a>
      <a href={basePath} onClick={handleClear}>
        Log Out
      </a>
    </div>
  );
}

export default TopNav;
