import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">{children}</main>
      <div className="app-watermark">⟳ Made with Emergent</div>
    </div>
  );
}

export default Layout;