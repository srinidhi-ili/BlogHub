import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/blog/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  FaSearch,
  FaFeatherAlt,
  FaPenFancy,
  FaArrowRight,
  FaBookOpen,
} from 'react-icons/fa';
import '../styles/Home.css';

/**
 * ============================================================================
 * Home Page Component (Landing Page)
 * ============================================================================
 * Features:
 * 1. Hero Section: Clean title, editorial subheading, and interactive search bar.
 *    Submitting the search redirects directly to `/explore?search=...`.
 * 2. Recent Articles Grid: Dynamically fetches up to 6 published stories from
 *    GET /posts?limit=6 and renders them as `PostCard` elements.
 * 3. Call-to-Action (CTA): Welcomes writers to share their voice, directing
 *    authenticated users to `/create-post` and newcomers to `/register`.
 * ============================================================================
 */
const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent published posts
  useEffect(() => {
    const fetchRecentPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/posts', {
          params: { limit: 6, sort: 'desc' },
        });

        const list =
          response.data.posts || response.data.data || response.data;

        if (Array.isArray(list)) {
          // Public feed only presents published articles
          const published = list.filter(
            (p) => !p.status || p.status === 'published'
          );
          setPosts(published.slice(0, 6));
        }
      } catch (err) {
        console.warn('Recent posts fetch note:', err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  // Handle Search submit -> redirects to Explore with query param
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <FaFeatherAlt className="hero-badge-icon" />
          <span>A Home for Human Ideas</span>
        </div>

        <h1 className="hero-title">Welcome to BlogSpace</h1>
        <p className="hero-subtitle">
          Discover stories, thinking, and expertise from writers on any topic.
        </p>

        {/* Search Bar */}
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search articles, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search articles"
            />
          </div>
          <button type="submit" className="search-btn">
            Explore
          </button>
        </form>
      </section>

      {/* Featured / Recent Articles Section */}
      <section className="recent-posts-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Featured Stories</h2>
            <p className="section-subheading">
              Hand-picked and trending perspectives from our community.
            </p>
          </div>
          <Link to="/explore" className="view-all-link">
            <span>View All Posts</span> <FaArrowRight />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Curating latest articles..." />
        ) : posts.length === 0 ? (
          <div className="empty-feed-card">
            <div className="empty-feed-icon-box">
              <FaBookOpen />
            </div>
            <h3 className="empty-feed-title">No articles published yet</h3>
            <p className="empty-feed-message">
              Be the first to share your thoughts and expertise with the world!
            </p>
            <Link
              to={isAuthenticated ? '/create-post' : '/register'}
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
            >
              <FaPenFancy /> Write the First Story
            </Link>
          </div>
        ) : (
          <div className="home-posts-grid">
            {posts.map((post) => (
              <PostCard key={post._id || post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Call to Action (CTA) Section */}
      <section className="home-cta-section">
        <div className="cta-inner-card">
          <div className="cta-icon-box">
            <FaPenFancy />
          </div>
          <h2 className="cta-title">Start Writing Today</h2>
          <p className="cta-description">
            Share your voice with readers around the world. Whether you're an
            industry expert, a hobbyist, or a curious student, your insights matter.
          </p>
          <div className="cta-actions">
            {isAuthenticated ? (
              <Link to="/create-post" className="btn btn-primary btn-lg">
                <FaPenFancy /> Compose a Story
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started for Free
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
