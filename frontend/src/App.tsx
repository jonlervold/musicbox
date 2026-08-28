import { useEffect } from "react";
import TopNav from "./components/TopNav";
import CodeEntry from "./components/CodeEntry";
import Directory from "./components/Directory";
import Folder from "./components/Folder";
import { LocalStorageSvc } from "./services/LocalStorageSvc";
import { UrlParamsSvc } from "./services/UrlParamsSvc";
import { useAppStore } from "./store/useAppStore";
import "./App.scss";

function App() {
  const code = useAppStore((state) => state.code);
  const setCode = useAppStore((state) => state.setCode);
  const folder = useAppStore((state) => state.folder);
  const setFolder = useAppStore((state) => state.setFolder);

  useEffect(() => {
    const folderFromUrl = UrlParamsSvc.getFolder();
    if (folderFromUrl) {
      setFolder(folderFromUrl);
    }
  }, [setFolder]);

  useEffect(() => {
    const storedCode = LocalStorageSvc.getCode();
    if (storedCode) {
      setCode(storedCode);
    }
  }, [setCode]);

  if (!code) {
    return <CodeEntry />;
  }

  return (
    <>
      <div className="app__app-name">MusicBox</div>
      <TopNav />
      {folder ? <Folder /> : <Directory />}
    </>
  );
}

export default App;
