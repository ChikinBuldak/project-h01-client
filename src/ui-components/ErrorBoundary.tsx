import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("💥 Uncaught error in React:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            color: "red",
            fontSize: "2rem",
            textAlign: "center",
            paddingTop: "20vh",
            height: "100vh",
            fontFamily: "monospace",
          }}
        >
          ⚠️ A fatal error occurred
          <pre style={{ color: "white", fontSize: "1rem", marginTop: "2rem" }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
