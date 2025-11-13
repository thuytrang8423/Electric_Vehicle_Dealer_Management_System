import { useState, useMemo, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import Navbar from './Navbar';
import Footer from './Footer';
import './Dealers.css';

const sampleReviews = [
  {
    id: 'sample-1',
    name: 'Lan Pham',
    rating: 5,
    message: 'Excellent support and fast delivery scheduling. The staff was very professional.',
    createdAt: '2025-01-12T09:00:00Z'
  },
  {
    id: 'sample-2',
    name: 'Minh Tran',
    rating: 4,
    message: 'Good consultation. Would love to see more color options in the showroom.',
    createdAt: '2025-01-05T14:25:00Z'
  }
];

const DetailDealer = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dealer = location.state?.dealer;

  const [reviews, setReviews] = useState(() => {
    const providedReviews = location.state?.reviews;
    if (Array.isArray(providedReviews) && providedReviews.length > 0) {
      return providedReviews.map((review, index) => ({
        id: review.id || `provided-${index}`,
        name: review.name || 'Anonymous',
        rating: Number(review.rating) || 0,
        message: review.message || '',
        createdAt: review.createdAt || new Date().toISOString()
      }));
    }
    return sampleReviews;
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!dealer) {
      navigate('/dealer', { replace: true });
    }
  }, [dealer, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const ratingBreakdown = useMemo(() => {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      const key = Math.round(review.rating) || 0;
      if (breakdown[key] !== undefined) {
        breakdown[key] += 1;
      }
    });
    return breakdown;
  }, [reviews]);

  if (!dealer) {
    return null;
  }

  const dealerInfoItems = [
    { icon: 'bx bx-map', label: 'Address', value: dealer.address || 'N/A' },
    { icon: 'bx bx-phone', label: 'Phone', value: dealer.phone || 'N/A' },
    { icon: 'bx bx-user', label: 'Representative', value: dealer.representativeName || dealer.representative || 'N/A' },
    { icon: 'bx bx-map-pin', label: 'Region', value: dealer.region || 'N/A' }
  ];

  const mapQuery = encodeURIComponent(dealer.address || `${dealer.name || 'EVM Dealer'}, Vietnam`);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRatingChange = (value) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your full name';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.message.trim()) newErrors.message = 'Please share your experience';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const newReview = {
        id: `review-${Date.now()}`,
        name: formData.name.trim(),
        rating: Number(formData.rating),
        message: formData.message.trim(),
        createdAt: new Date().toISOString()
      };
      setReviews((prev) => [newReview, ...prev]);
      setFormData({ name: '', email: '', rating: 5, message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (value) => {
    const full = Math.round(value);
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <i key={star} className={`bx bxs-star${star <= full ? ' filled' : ''}`}></i>
        ))}
      </div>
    );
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dealer-detail-page">
      <Navbar />

      <div className="dealer-detail-container">
        <nav className="dealer-breadcrumb">
          <Link to="/">Home</Link>
          <i className="bx bx-chevron-right"></i>
          <Link to="/dealer">Dealer</Link>
          <i className="bx bx-chevron-right"></i>
          <span className="current">Feedback</span>
        </nav>

        <section className="dealer-summary">
          <div className="dealer-summary-card">
            <div className="summary-header">
              <div className="summary-icon">
                <i className="bx bx-store"></i>
              </div>
              <div>
                <h1>{dealer.name || `Dealer #${id}`}</h1>
                <p className="dealer-status-pill">{dealer.status || 'ACTIVE'}</p>
              </div>
            </div>
            <p className="summary-description">
              Discover essential information and real customer feedback about this authorized EVM dealer.
            </p>
            <div className="summary-info-grid">
              {dealerInfoItems.map((item, index) => (
                <div key={index} className="summary-info-item">
                  <i className={item.icon}></i>
                  <div>
                    <span className="label">{item.label}</span>
                    <span className="value">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="dealer-map">
              <h3>Dealer Location</h3>
              <div className="map-frame">
                <iframe
                  title={`Map of ${dealer.name || `Dealer #${id}`}`}
                  src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="share-experience-card">
            <h2>Share your experience</h2>
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Feedback</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className={errors.message ? 'error' : ''}
                  placeholder="Tell us about the service you received..."
                  rows="6"
                  required
                />
                {errors.message && <span className="error-message">{errors.message}</span>}
              </div>

              <div className="form-group">
                <label>Rate this dealer</label>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`star ${value <= formData.rating ? 'selected' : ''}`}
                      onClick={() => handleRatingChange(value)}
                    >
                      <i className="bx bxs-star"></i>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bx bx-send"></i>
                    Submit Review
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        <section className="dealer-feedback-section">
          <div className="rating-summary">
            <div className="rating-summary-header">
              <div className="rating-score-block">
                <div className="rating-score">{averageRating.toFixed(1)}</div>
                {renderStars(averageRating)}
                <p className="rating-count">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="rating-score-extra">
                <div className="rating-label">Overall satisfaction</div>
                <p className="rating-subtext">The average rating calculated from customer feedback.</p>
              </div>
            </div>
            <ul className="rating-breakdown">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = ratingBreakdown[value];
                const percent = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <li key={value}>
                    <div className="breakdown-label">
                      <span>{value}</span>
                      <i className="bx bxs-star"></i>
                    </div>
                    <div className="progress">
                      <div style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="count">{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="feedback-list-wrapper">
            <h2>Recent feedback</h2>
            <div className="feedback-list">
              {reviews.length === 0 ? (
                <div className="feedback-empty">
                  <i className="bx bx-message-dots"></i>
                  <p>No feedback yet. Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="feedback-card">
                    <div className="feedback-card-header">
                      <div>
                        <p className="feedback-name">{review.name}</p>
                        <p className="feedback-date">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="feedback-rating">
                        {renderStars(review.rating)}
                        <span>{Number(review.rating).toFixed(1)}/5</span>
                      </div>
                    </div>
                    <p className="feedback-message">{review.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default DetailDealer;
