import React, { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { ratingService, type RatingData } from '../../services/ratingService';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'Ticket' | 'Complaint';
  itemId: string;
  itemTitle: string;
  onRatingSubmitted?: (rating: RatingData) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
  onRatingSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && itemId) {
      setFetching(true);
      setError(null);
      setSubmitted(false);
      ratingService
        .getRating(itemType, itemId)
        .then((existing) => {
          if (existing) {
            setRating(existing.rating);
            setFeedback(existing.feedback || '');
          } else {
            setRating(5);
            setFeedback('');
          }
        })
        .finally(() => setFetching(false));
    }
  }, [isOpen, itemId, itemType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    try {
      setLoading(true);
      setError(null);
      const res = await ratingService.submitRating({
        itemId,
        itemType,
        rating,
        feedback: feedback.trim(),
      });
      setSubmitted(true);
      if (onRatingSubmitted) {
        onRatingSubmitted(res);
      }
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  const starLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rate Support Experience — ${itemType}`}
    >
      {fetching ? (
        <div className="py-8 flex justify-center items-center text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading rating details...
        </div>
      ) : submitted ? (
        <div className="py-6 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-semibold text-gray-900">Thank you for your feedback!</h3>
          <p className="text-sm text-gray-500">
            Your CSAT rating helps us continuously improve our service quality.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Service Resolution
            </p>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{itemTitle}</p>
          </div>

          <div className="text-center space-y-2 py-2">
            <p className="text-xs font-medium text-gray-600">
              How would you rate the resolution of your {itemType.toLowerCase()}?
            </p>

            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = hoverRating ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    className="p-1 text-gray-300 hover:text-amber-400 focus:outline-hidden transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-sm font-semibold text-amber-600 min-h-5">
              {starLabels[(hoverRating || rating) - 1]}
            </p>
          </div>

          <Textarea
            label="Additional Feedback (Optional)"
            placeholder="Tell us what went well or how we can improve..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default RatingModal;
