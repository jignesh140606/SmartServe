import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Badge } from './Badge';
import { Star, MessageSquare, ThumbsUp, Sparkles, Filter } from 'lucide-react';
import type { RatingData, RatingStats } from '../../services/ratingService';
import { formatTimeAgo } from '../../lib/dateUtils';

interface CustomerFeedbackSectionProps {
  stats: RatingStats | null;
  ratings: RatingData[];
  isLoading?: boolean;
}

export function CustomerFeedbackSection({ stats, ratings, isLoading = false }: CustomerFeedbackSectionProps) {
  const [filterStar, setFilterStar] = useState<number | 'all'>('all');

  const total = stats?.totalRatings || ratings.length;
  const avg = stats && stats.totalRatings > 0 ? Number(stats.averageRating).toFixed(1) : total > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';

  const distribution = stats?.distribution || {
    5: ratings.filter((r) => r.rating === 5).length,
    4: ratings.filter((r) => r.rating === 4).length,
    3: ratings.filter((r) => r.rating === 3).length,
    2: ratings.filter((r) => r.rating === 2).length,
    1: ratings.filter((r) => r.rating === 1).length,
  };

  const filteredRatings = ratings.filter((r) => {
    if (filterStar === 'all') return true;
    return r.rating === filterStar;
  });

  return (
    <Card className="border-neutral-200/90 shadow-soft-sm overflow-hidden">
      <CardHeader border className="bg-gradient-to-r from-amber-50/40 via-white to-neutral-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-soft-xs">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-neutral-900">Customer Satisfaction & Verified Feedback</CardTitle>
                <Badge variant="warning" size="sm">
                  CSAT Dashboard
                </Badge>
              </div>
              <CardDescription className="text-xs text-neutral-500">
                Aggregated resolution ratings, sentiment scores, and authentic customer experience reviews
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Total Reviews:</span>
            <span className="text-sm font-bold text-neutral-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-900">
              {total} Submitted
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Top Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Average Rating Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border border-amber-200/80 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Overall CSAT Score</span>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-700">{avg}</span>
              <span className="text-base font-semibold text-neutral-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(avg)) ? 'text-amber-500 fill-amber-400' : 'text-neutral-200'
                  }`}
                />
              ))}
              <span className="text-xs font-semibold text-neutral-600 ml-1.5">
                {Number(avg) >= 4 ? 'Exceptional Service' : Number(avg) >= 3 ? 'Good Service' : total === 0 ? 'No Ratings Yet' : 'Needs Attention'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1 border-t border-amber-100 pt-2 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Verified ratings submitted upon ticket completion
            </p>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 flex flex-col justify-between md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Rating Distribution</span>
              <span className="text-xs text-neutral-400">{total} total customer responses</span>
            </div>

            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div
                    key={star}
                    onClick={() => setFilterStar(filterStar === star ? 'all' : star)}
                    className={`flex items-center gap-3 text-xs cursor-pointer px-2 py-1 rounded-md transition-colors ${
                      filterStar === star ? 'bg-amber-100/70 font-semibold' : 'hover:bg-neutral-100'
                    }`}
                    title={`Click to filter by ${star} star reviews`}
                  >
                    <div className="flex items-center gap-1 w-12 shrink-0">
                      <span className="text-neutral-700 font-medium">{star}</span>
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          star >= 4 ? 'bg-amber-500' : star === 3 ? 'bg-yellow-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-[11px] text-neutral-500 shrink-0 font-medium">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-200/80 pt-2 mt-2">
              <span>Filter reviews by clicking any star bar above</span>
              {filterStar !== 'all' && (
                <button
                  onClick={() => setFilterStar('all')}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Clear Filter (Show All)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews & Feedback List Header */}
        <div className="border-t border-neutral-100 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-500" />
              <h4 className="text-sm font-bold text-neutral-900">
                Customer Reviews & Comments
                {filterStar !== 'all' && <span className="text-xs text-amber-700 font-medium ml-1.5">({filterStar}★ Filtered)</span>}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-neutral-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              <button
                onClick={() => setFilterStar('all')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterStar === 'all'
                    ? 'bg-neutral-900 text-white shadow-soft-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All ({ratings.length})
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStar(filterStar === s ? 'all' : s)}
                  className={`text-xs px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                    filterStar === s
                      ? 'bg-amber-500 text-white shadow-soft-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {s}★ ({distribution[s as 1 | 2 | 3 | 4 | 5] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Items Feed */}
          {isLoading ? (
            <div className="py-10 text-center text-neutral-400">
              <p className="text-sm">Loading verified customer reviews...</p>
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-neutral-50/70 border border-dashed border-neutral-200 p-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 fill-amber-300" />
              </div>
              <h5 className="text-sm font-bold text-neutral-800">
                {filterStar !== 'all' ? `No ${filterStar}-star reviews found` : 'No Customer Reviews Yet'}
              </h5>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                {filterStar !== 'all'
                  ? 'Try selecting a different rating filter or click "All" to view all reviews.'
                  : 'Customer satisfaction reviews will appear here once customers resolve their service requests and submit their feedback.'}
              </p>
              {filterStar !== 'all' && (
                <button
                  onClick={() => setFilterStar('all')}
                  className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRatings.map((review) => {
                const customerUser = review.customerId?.userId;
                const customerName = customerUser?.name || 'Verified Customer';
                const customerEmail = customerUser?.email || '';

                return (
                  <div
                    key={review._id}
                    className="p-4 rounded-xl border border-neutral-200/80 bg-white hover:border-amber-200 hover:shadow-soft-xs transition-all space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-xs flex items-center justify-center border border-primary-100">
                          {customerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900 leading-tight">{customerName}</p>
                          {customerEmail && (
                            <p className="text-[11px] text-neutral-400">{customerEmail}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge variant={review.itemType === 'Ticket' ? 'primary' : 'danger'} size="sm">
                          {review.itemType}
                        </Badge>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                          {review.rating}★
                        </span>
                      </div>
                    </div>

                    {review.feedback ? (
                      <p className="text-xs text-neutral-700 italic bg-neutral-50/70 p-2.5 rounded-lg border border-neutral-100 leading-relaxed">
                        "{review.feedback}"
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No written comment provided.</p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-100 pt-2">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <ThumbsUp className="w-3 h-3" /> Verified Customer Feedback
                      </span>
                      <span>{formatTimeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
