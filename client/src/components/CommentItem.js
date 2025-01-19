// src/components/CommentItem.js
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CommentItem = ({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  allComments,
  level = 0 
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.permbajtja);
  const [replyText, setReplyText] = useState('');

  // Get all replies for this comment
  const replies = allComments.filter(c => c.komenti_prind_id === comment.komenti_id);

  const handleReplyClick = () => {
    setIsReplying(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsReplying(false);
    setEditText(comment.permbajtja);
  };

  const handleSubmitEdit = () => {
    onEdit(comment.komenti_id, editText);
    setIsEditing(false);
  };

  return (
    <div className="comment-thread" style={{ marginLeft: `${level * 20}px` }}>
      <div className={`comment-item ${level > 0 ? 'comment-reply' : ''}`}>
        <div className="comment-header">
          <span className="comment-author">{comment.emer_perdoruesi}</span>
          <span className="comment-date">
            {new Date(comment.krijuar_me).toLocaleDateString('en-GB', {
              separator: '.'
            }).replace(/\//g, '.')}
            {(() => {
                if (comment.eshte_edituar) {
                    return ' (modifikuar)';
                }
                return '';
                })()}
          </span>
        </div>
        {isEditing ? (
          <div className="comment-edit">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="comment-input"
            />
            <div className="comment-actions">
              <button onClick={handleSubmitEdit}>Ruaj</button>
              <button onClick={() => setIsEditing(false)}>Anulo</button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.permbajtja}</p>
        )}

        {!isEditing && (
          <div className="comment-actions">
            <button onClick={handleReplyClick}>Përgjigju</button>
            {user && user.id === comment.perdoruesi_id && (
              <>
                <button onClick={handleEditClick}>Modifiko</button>
                <button onClick={() => onDelete(comment.komenti_id)}>Fshi</button>
              </>
            )}
          </div>
        )}

        {isReplying && (
          <div className="reply-form">
            <textarea
              placeholder="Write a reply..."
              className="comment-input"
            //   value={replyText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="comment-actions">
              <button onClick={() => {
                onReply(comment.komenti_id, editText);
                setIsReplying(false);
                setEditText('');
              }}>Komento</button>
              <button onClick={() => setIsReplying(false)}>Anulo</button>
            </div>
          </div>
        )}
      </div>

      {/* Recursively render replies */}
      {replies.length > 0 && (
        <div className="replies">
          {replies.map(reply => (
            <CommentItem
              key={reply.komenti_id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              allComments={allComments}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;