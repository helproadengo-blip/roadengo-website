import React from 'react';

/**
 * Stops one bad field from taking down a whole screen.
 *
 * A single unrenderable value (a `{latitude, longitude}` object where a string
 * was expected) used to unmount the entire React tree, leaving mechanics
 * staring at a white page with no idea what had happened. Now the rest of the
 * app keeps working and the person is told what to do.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <i className="ri-error-warning-line text-red-600 text-3xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-5">This screen ran into a problem</h1>
          <p className="text-gray-600 mt-2">
            Your work is safe and you are still signed in. Reload the page to carry on.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
            >
              Try again
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-5 break-words">{String(this.state.error?.message || '')}</p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
