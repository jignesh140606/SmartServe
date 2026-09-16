import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, Search, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { trackingService, type CannedResponseItem } from '../../services/trackingService';

interface CannedResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResponse?: (text: string) => void;
  itemCategory?: string;
}

export const CannedResponsesModal: React.FC<CannedResponsesModalProps> = ({
  isOpen,
  onClose,
  onSelectResponse,
  itemCategory,
}) => {
  const [responses, setResponses] = useState<CannedResponseItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      trackingService
        .getCannedResponses()
        .then((data) => {
          if (Array.isArray(data)) {
            setResponses(data);
          }
        })
        .catch((err) => console.error('Failed to load canned responses:', err));
    }
  }, [isOpen]);

  const categories = [
    'all',
    ...Array.from(new Set(responses.map((r) => r.category).filter(Boolean))),
  ];

  const query = search.trim().toLowerCase();

  const filtered = responses.filter((item) => {
    const itemCat = item.category || 'General';
    const matchesCategory = selectedCategory === 'all' || itemCat === selectedCategory;

    const title = (item.title || (item as any).label || '').toLowerCase();
    const text = (item.text || (item as any).message || '').toLowerCase();
    const tags = Array.isArray(item.tags) ? item.tags : [];

    const matchesSearch =
      !query ||
      title.includes(query) ||
      text.includes(query) ||
      tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUse = (text: string) => {
    if (onSelectResponse) {
      onSelectResponse(text);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Smart Auto-Replies & Canned Responses">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Choose a standardized, professional response to communicate instantly with customers.
            {itemCategory && ` (Suggested for: ${itemCategory})`}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search responses by title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No matching canned responses found.
            </div>
          ) : (
            filtered.map((item) => {
              const itemTitle = item.title || (item as any).label || 'Response Template';
              const itemText = item.text || (item as any).message || '';
              const itemTags = Array.isArray(item.tags) ? item.tags : [];

              return (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-semibold text-gray-900">{itemTitle}</h4>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 whitespace-pre-line bg-gray-50/70 p-2.5 rounded-md border border-gray-100 leading-relaxed font-mono text-[11px]">
                    {itemText}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1 flex-wrap">
                      {itemTags.map((tag) => (
                        <span key={tag} className="text-[10px] text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(item.id, itemText)}
                        className="text-xs py-1 px-2"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                          </>
                        )}
                      </Button>

                      {onSelectResponse && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUse(itemText)}
                          className="text-xs py-1 px-2.5"
                        >
                          Use Response
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CannedResponsesModal;
