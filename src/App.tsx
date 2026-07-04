import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ToastHost } from "@/components/Toast";
import { useAuth } from "@/store/useAuth";

import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import PromptDetail from "@/pages/PromptDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Submit from "@/pages/Submit";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

export default function App() {
  const init = useAuth((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/prompt/:id" element={<PromptDetail />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/*" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/sources" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <ToastHost />
    </Router>
  );
}
