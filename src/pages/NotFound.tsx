import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-app grid min-h-[calc(100vh-68px)] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-gradient sm:text-9xl">404</p>
        <h1 className="mt-4 font-display text-xl font-bold">页面走丢了</h1>
        <p className="mt-2 text-sm text-mist-400">这个页面可能已被移除或从未存在</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-neon">
            <Home className="h-4 w-4" /> 回到首页
          </Link>
          <Link to="/explore" className="btn-ghost">
            <Compass className="h-4 w-4" /> 去探索
          </Link>
        </div>
      </div>
    </div>
  );
}
