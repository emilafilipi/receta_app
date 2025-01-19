// src/pages/RecipeDetail.js
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommentItem from '../components/CommentItem';
import HeartIcon from '../components/HeartIcon';
import '../styles/RecipeDetail.css';

function RecipeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchRecipeDetails();
    if (user) {
        fetchUserRating();
        checkFavoriteStatus();
      }
  }, [id, user]);

  const isCommentOwner = (comment) => {
    return user && user.id === comment.perdoruesi_id;
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}/favorite`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const fetchRecipeDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}`);
      
      if (!response.ok) throw new Error('Failed to fetch recipe details');
      const data = await response.json();
      setRecipe(data);
      
      if (user) {
        const ratingResponse = await fetch(
          `http://localhost:5000/api/recipes/${id}/rating`, 
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          setUserRating(ratingData.rating);
        }
      }
    } catch (err) {
      setError('Failed to load recipe details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}/rating`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserRating(data.rating || 0);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRating = async (rating) => {
    try {
        const token = localStorage.getItem('token');
    console.log('Sending comment with token:', token);

      const response = await fetch(`http://localhost:5000/api/recipes/${id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ yjet: rating })
      });

      if (!response.ok) throw new Error('Failed to add rating');

      const data = await response.json();
      
      // Refresh recipe data to get updated rating
      fetchRecipeDetails();
      setUserRating(rating);
      setRecipe(prev => ({
        ...prev,
        mesatarja_yjeve: data.averageRating
      }));
    } catch (err) {
      console.error('Error adding rating:', err);
      alert('Failed to add rating: ' + err.message);
    }
  };

  const handleAddComment = async () => {
    try {
        const token = localStorage.getItem('token');
    console.log('Sending comment with token:', token);

      const response = await fetch(`http://localhost:5000/api/recipes/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permbajtja: newComment })
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      const newCommentData = await response.json();
      setRecipe(prev => ({
        ...prev,
        comments: [newCommentData, ...prev.comments]
      }));
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleReply = async (commentId, replyText) => {
    try {
        console.log("Sending reply:", { commentId, replyText });
      const response = await fetch(`http://localhost:5000/api/recipes/${id}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          permbajtja: replyText,
          komenti_prind_id: commentId
        })
      });

      if (!response.ok) throw new Error('Failed to add reply');
      
      const newReplyData = await response.json();
      setRecipe(prev => ({
        ...prev,
        comments: [...prev.comments, newReplyData]
      }));
       setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    try {
        console.log("Editing comment: ", {commentId, newText});
      const response = await fetch(`http://localhost:5000/api/recipes/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permbajtja: newText })
      });

      const updatedComment = await response.json();

    if (!response.ok) {
      throw new Error(updatedComment.message || 'Failed to update comment');
    }

    //   if (!response.ok) throw new Error('Failed to update comment');
      
      setRecipe(prev => ({
        ...prev,
        comments: prev.comments.map(comment => 
          comment.komenti_id === commentId 
            ? { ...comment, permbajtja: newText, eshte_edituar: true }
            : comment
        )
        // comments: prev.comments.map(comment => 
        //     comment.komenti_id === commentId ? {...comment, ...updatedComment} : comment
        //   )
      }));
      setNewComment('');
      setEditingComment(null);
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      
      setRecipe(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.komenti_id !== commentId)
      }));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (loading) return <div className="loading">Loading recipe...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!recipe) return <div className="error-message">Recipe not found</div>;

  const renderRatingStars = () => {
    return (
      <div className="rating-section">
        <div className="average-rating">
          Vlerësimi Mesatar: {recipe.mesatarja_yjeve ? Number(recipe.mesatarja_yjeve).toFixed(1) : 'Nuk ka vlerësime'} 
        </div>
        <div className="user-rating">
          Vlerëso Recetën:
          {[1, 2, 3, 4, 5].map((star) => (
            
            <span
            key={star}
            onClick={() => handleRating(star)}
            // className="star-rating-container"
             className={`star-rating-container ${userRating >= star ? 'filled' : ''}`}
            // className={`star-rating-container ${userRating >= star ? '★' : '☆'}`}
          >
            {/* {userRating >= star ? '★' : '☆'} */}
            {/* ☆ */}
            ★
          </span>
          ))}
        </div>
      </div>
    );
  };

  const renderComments = () => {
    // Get top-level comments (no parent)
    const topLevelComments = recipe.comments?.filter(c => !c.komenti_prind_id) || [];
  
    return (
      <section className="recipe-comments">
        <h2>Komentet</h2>
        
        <div className="add-comment">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Lër një koment..."
            className="comment-input"
          />
          <button 
            onClick={handleAddComment}
            className="comment-button"
          >
            Komento
          </button>
        </div>
  
        <div className="comments-list">
          {topLevelComments.map(comment => (
            <CommentItem
              key={comment.komenti_id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              allComments={recipe.comments || []}
            />
          ))}
        </div>
      </section>
    );
  };

  const toggleFavorite = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getImageUrl = (recipe) => {
    try {
      if (!recipe.url_media) return null;
  
      try {
        const mediaUrls = JSON.parse(recipe.url_media);
        return mediaUrls.length > 0 ? `http://localhost:5000${mediaUrls[0]}` : null;
      } catch {
        return `http://localhost:5000${recipe.url_media}`;
      }
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  };

  return (
    <div className="recipe-detail-page">
      <Navbar />
      <div className="recipe-detail-container">
        <div className="recipe-header">
          <div className="titulli">
            <h1 className="recipe-title">{recipe.titulli}</h1>
            {user && (
              <button 
                onClick={toggleFavorite}
                className="favorite-button"
                aria-label={isFavorite ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
              >
                <HeartIcon filled={isFavorite} />
              </button>
            )}
          </div>
          <div className="recipe-meta-info">
            <span>Niveli i Vështirësisë: {recipe.veshtiresia}</span>
            <span>•</span>
            <span>Koha e Përgatitjes: {recipe.koha_pergatitja} min</span>
            <span>•</span>
            <span>Koha e Gatimit: {recipe.koha_gatimi} min</span>
            <span>•</span>
            <span>Numri i Racioneve: {recipe.nr_racione}</span>
          </div>
          <div className='recipe-meta-info'>
            <span>Krijuar nga: {recipe.perdoruesi}</span>
          </div>
        </div>

        {renderRatingStars()}

        <div className="recipe-image-container">
          {recipe.url_media && (
            <img 
              src={getImageUrl(recipe)}
              alt={recipe.titulli} 
              className="recipe-main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-recipe.jpg';
              }}
            />
          )}
        </div>

        <div className="recipe-content-grid">
          
          <div className="recipe-info">
            
            <section className="recipe-detail-description">
              <h2>Përshkrimi</h2>
              <p>{recipe.pershkrimi}</p>
            </section>

            <section className="recipe-ingredients">
              <h2>Përbërësit</h2>
              <ul>
                {recipe.ingredients?.map((ingredient, index) => (
                  <li key={index}>
                    {ingredient.sasia} {ingredient.njesia} {ingredient.emri}
                  </li>
                ))}
              </ul>
            </section>

            <section className="recipe-steps">
              <h2>Hapat e Përgatitjes</h2>
              <div className="steps-list">
                {recipe.steps?.map((step) => (
                  <div key={step.hapi_id} className="step-item">
                    <div className="step-header">
                      <h3>Hapi {step.nr_hapi}</h3>
                      {step.kohezgjatja && (
                        <span className="step-duration">{step.kohezgjatja} min</span>
                      )}
                    </div>
                    <p>{step.pershkrimi}</p>
                  </div>
                ))}
              </div>
            </section>
            

          </div>

          <div className="recipe-sidebar">
                        
            <div className="recipe-categories">
              <h3>Kategoria</h3>
              {recipe.categories?.map((category) => (
                <span key={category.kategoria_id} className="category-tag">
                  {category.emri}
                </span>
              ))}
            </div>

            {renderComments()}

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default RecipeDetail;