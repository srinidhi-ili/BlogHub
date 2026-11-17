import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import BlogDetail from './pages/BlogDetail';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import MyBlogs from './pages/MyBlogs';
import AdminDashboard from './pages/AdminDashboard';
import WriterDashboard from './pages/WriterDashboard';
import NotFound from './pages/NotFound';
import './styles/Common.css';
import './App.css';

/**
 * ============================================================================
 * Root App Component
 * ============================================================================
 * Provides routing architecture with global context providers:
 * - <AuthProvider>: Shares user session and authentication actions.
 * - <BrowserRouter>: Coordinates client-side routing.
 * - <Navbar>: Responsive persistent navigation header.
 * - <ProtectedRoute> / <AdminRoute>: Guard components for authenticated views.
 * ============================================================================
 */
function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/post/:id" element={<BlogDetail />} />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-post/:id"
                element={
                  <ProtectedRoute>
                    <EditPost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <WriterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-blogs"
                element={
                  <ProtectedRoute>
                    <MyBlogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
