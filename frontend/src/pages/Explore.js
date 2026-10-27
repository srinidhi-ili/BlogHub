import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/blog/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FaSearch, FaFilter, FaSortAmountDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/Explore.css';

/**
 * ============================================================================
 * Explore Page Component
 * ============================================================================
 * Central discovery catalog for all published articles on the platform.
 *
 * Core Features:
 * 1. Synchronized URL Search Params: Reading and updating query params
 *    (`?search=...&category=...&page=...`) allows deep linking and shareable URLs.
 * 2. Multi-Criteria Filtering: Combines text query, category selection, and
 *    chronological sorting (newest/oldest).
 * 3. Client & Server Resilience: Graciously processes either paginated objects
 *    `{ posts, totalPages }` or standard array responses `[post, post]` from
 *    backend endpoints.
 * 4. Pagination: Forward/back controls with disabled bounds and page numbering.
 * ============================================================================
 */
const CATEGORIES = [
  'All Categories',
  'Technology',
  'Lifestyle',
  'Education',
  'Health',
  'Travel',
  'Food',
  'Sports',
  'Entertainment',
  'Science',
  'Other',
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter criteria from URL or defaults
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Fetch posts from backend API GET /posts
   */
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        limit: 9,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.category = selectedCategory;
      }

      params.sort = selectedSort === 'oldest' ? 'asc' : 'desc';

      const response = await api.get('/posts', { params });

      // Handle various backend response formats
      let fetchedList = [];
      let calculatedTotalPages = 1;

      if (Array.isArray(response.data)) {
        fetchedList = response.data;
      } else if (response.data && Array.isArray(response.data.posts)) {
        fetchedList = response.data.posts;
        calculatedTotalPages = response.data.totalPages || response.data.pages || 1;
      } else if (response.data && Array.isArray(response.data.data)) {
        fetchedList = response.data.data;
        calculatedTotalPages = response.data.totalPages || 1;
      }

      // Filter only published articles for public explore feed if backend includes drafts
      const publishedPosts = fetchedList.filter(
        (p) => !p.status || p.status === 'published'
      );

      setPosts(publishedPosts);
      setTotalPages(Math.max(calculatedTotalPages, 1));
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError('Could not retrieve articles. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedSort]);

  // Sync state to URL params and trigger fetch
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory && selectedCategory !== 'All Categories') params.category = selectedCategory;
    if (selectedSort !== 'newest') params.sort = selectedSort;
    if (currentPage > 1) params.page = currentPage;

    setSearchParams(params, { replace: true });
    fetchPosts();
  }, [currentPage, searchTerm, selectedCategory, selectedSort, setSearchParams, fetchPosts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSelectedSort(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="explore-container">
      {/* Top Header */}
      <div className="explore-header">
        <h1 className="explore-title">Explore Stories & Ideas</h1>
        <p className="explore-subtitle">
          Browse through human-written perspectives across technology, life, and culture.
        </p>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="explore-controls-panel">
        <form onSubmit={handleSearchSubmit} className="explore-search-bar">
          <FaSearch className="search-bar-icon" />
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search by keywords or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search posts"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              &times;
            </button>
          )}
        </form>

        <div className="explore-dropdown-group">
          {/* Category Filter */}
          <div className="dropdown-wrapper">
            <FaFilter className="dropdown-icon" />
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="explore-select"
              aria-label="Filter by Category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="dropdown-wrapper">
            <FaSortAmountDown className="dropdown-icon" />
            <select
              value={selectedSort}
              onChange={handleSortChange}
              className="explore-select"
              aria-label="Sort Order"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && <div className="explore-error-message">{error}</div>}

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Fetching community stories..." size="large" />
      ) : posts.length === 0 ? (
        <div className="explore-empty-state">
          <div className="empty-state-graphic">🔍</div>
          <h2 className="empty-state-title">No articles found</h2>
          <p className="empty-state-text">
            No articles found. Try adjusting your search or filters.
          </p>
          {(searchTerm || selectedCategory !== 'All Categories') && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All Categories');
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="explore-posts-grid">
            {posts.map((post) => (
              <PostCard key={post._id || post.id} post={post} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="explore-pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                aria-label="Previous Page"
              >
                <FaChevronLeft /> Previous
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                aria-label="Next Page"
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
