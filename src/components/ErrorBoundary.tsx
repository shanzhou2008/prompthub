import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#fff" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>页面渲染出错</h2>
          <pre style={{ fontSize: "12px", color: "#f87171", background: "#1a0000", padding: "12px", borderRadius: "8px", display: "inline-block", textAlign: "left", maxWidth: "100%", overflow: "auto" }}>
            {this.state.error?.message || "Unknown error"}
            {this.state.error?.stack ? "\n\n" + this.state.error.stack : ""}
          </pre>
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "8px 16px", background: "#a855f7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
