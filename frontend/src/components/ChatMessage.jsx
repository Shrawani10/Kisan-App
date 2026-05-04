import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

function toRenderableImageUrl(rawUrl) {
  if (!rawUrl) return '';

  try {
    const parsed = new URL(rawUrl);
    // Enforce local-folder images only (served by backend static route).
    if (parsed.hostname.includes('drive.google.com')) {
      return '';
    }
    return parsed.pathname.startsWith('/product-images') || parsed.pathname.startsWith('/api/')
      ? rawUrl
      : '';
  } catch (_err) {
    // Relative local URL case.
    if (rawUrl.startsWith('/product-images') || rawUrl.startsWith('/api/')) {
      return rawUrl;
    }
    return '';
  }
}

function normalizeTagItems(rawItems) {
  if (!rawItems) return [];

  const values = Array.isArray(rawItems) ? rawItems : [rawItems];

  return values
    .flatMap((value) => String(value).split(/[,;\n]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function KisanAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center shrink-0 shadow-sm">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s-8-5-8-11a8 8 0 0 1 16 0c0 6-8 11-8 11z" fill="#4aba6a"/>
        <path d="M12 22V14" stroke="#d8f3dc" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 18c0 0-2.5-2-4-4" stroke="#d8f3dc" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 15c0 0 2-2 3.5-3.5" stroke="#d8f3dc" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0 shadow-sm">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    </div>
  );
}

function ProductModal({ product, isOpen, onClose }) {
  const imageUrl = toRenderableImageUrl(product.image_url);
  const [imageFailed, setImageFailed] = useState(false);
  const diseaseTags = normalizeTagItems(product.diseases);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-0 right-0 p-4 text-gray-500 hover:text-gray-700 bg-white z-10"
        >
          ✕
        </button>

        {/* Product Details */}
        <div className="p-6">
          {imageUrl && !imageFailed && (
            <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3">
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                className="w-full max-h-56 object-contain rounded-md"
                onError={() => setImageFailed(true)}
              />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
          <p className="text-primary-600 font-semibold mb-1">{product.type}</p>
          {product.technical_name && (
            <p className="text-gray-600 italic text-sm mb-4">{product.technical_name}</p>
          )}

          {/* Features */}
          {product.features && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Features</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {product.features}
              </p>
            </div>
          )}

          {/* Applicable Crops */}
          {product.crops && product.crops.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Applicable Crops</h3>
              <div className="flex flex-wrap gap-2">
                {product.crops.map((crop, idx) => (
                  <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Diseases Treated */}
          {diseaseTags.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Treats</h3>
              <div className="flex flex-wrap gap-2">
                {diseaseTags.map((disease, idx) => (
                  <span key={`${disease}-${idx}`} className="bg-red-50 text-red-700 border border-red-300 px-3 py-1 rounded-full text-sm">
                    {disease}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Usage Instructions */}
          {product.crop_usage && product.crop_usage.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Usage Instructions</h3>
              <div className="space-y-3">
                {product.crop_usage.map((usage, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50">
                    <p className="font-semibold text-sm text-gray-800">
                      {usage.crop} - {usage.disease}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Dosage:</span> {usage.dosage}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Water:</span> {usage.water}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {product.keywords && product.keywords.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-1">
                {product.keywords.slice(0, 15).map((keyword, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {keyword}
                  </span>
                ))}
                {product.keywords.length > 15 && (
                  <span className="text-gray-500 text-xs pt-1">+{product.keywords.length - 15} more</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2 items-stretch border-t border-gray-200 pt-3">
            {product.price && product.unit && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-center flex flex-col justify-center min-w-fit">
                <p className="text-xs text-primary-600 font-semibold">Price</p>
                <p className="text-base font-bold text-primary-700">₹{product.price}</p>
                <p className="text-xs text-primary-600">per {product.unit}</p>
              </div>
            )}
            {product.buy_link ? (
              <a
                href={product.buy_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-3 rounded-lg transition duration-200 flex items-center justify-center gap-1.5 text-sm shadow-sm hover:shadow-md"
              >
                <span>🛒</span>
                Buy Now
              </a>
            ) : (
              <button
                className="flex-1 bg-gray-300 text-gray-600 font-semibold py-2 px-3 rounded-lg cursor-not-allowed text-sm"
                disabled
              >
                Coming Soon
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCardSimple({ product }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = toRenderableImageUrl(product.image_url);

  // Product type emojis
  const typeEmojis = {
    'FUNGICIDES': '🍄',
    'HERBICIDES': '🌿',
    'INSECTICIDES': '🐛',
    'PLANT GROWTH REGULATORS': '📈',
    'WATER SOLUBLE FERTILIZERS': '💧'
  };

  const emoji = typeEmojis[product.type] || '🌾';

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-green-50 transition-all cursor-pointer group min-w-fit"
      >
        {/* Product Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center border border-green-300 shadow-sm group-hover:shadow-md transition-all">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-1"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="text-3xl md:text-4xl">{emoji}</span>
          )}
        </div>

        {/* Product Name */}
        <p className="text-xs md:text-sm font-semibold text-gray-800 text-center line-clamp-2 w-16 md:w-20">
          {product.name}
        </p>

        {/* Price Badge */}
        {product.price && (
          <div className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
            ₹{product.price}
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default function ChatMessage({ message, t }) {
  const isUser = message.role === 'user';
  const text = isUser ? message.displayText : message.content;

  if (isUser) {
    return (
      <div className="flex flex-row-reverse items-end gap-2 animate-slide-up px-4 py-1">
        <UserAvatar />
        <div className="max-w-[78%] flex flex-col items-end gap-1">
          {text && (
            <div className="bg-primary-700 text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm">
              {text}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-end gap-2 animate-slide-up px-4 py-1">
      <KisanAvatar />
      <div className="max-w-[78%] flex flex-col overflow-hidden">
        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-800 leading-relaxed shadow-sm kisan-prose max-h-64 overflow-y-auto">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : (
            <TypingDots />
          )}

          {/* Source citations */}
          {message.citations?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide mb-1">Sources</p>
              <div className="flex flex-wrap gap-1">
                {message.citations.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] text-gray-400 max-w-[180px] truncate" title={c.title || c.filepath || `Document ${i + 1}`}>
                    <span className="font-bold text-primary-400 shrink-0">[{i + 1}]</span>
                    {c.title || c.filepath || `Doc ${i + 1}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommended Products with Responsive Horizontal Scroll */}
        {message.products?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-100">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1">
              <span>🌾 Recommended Products ({message.products.length})</span>
            </p>
            <div className="overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-3 snap-x snap-mandatory w-max">
                {message.products.map((product, idx) => (
                  <ProductCardSimple key={idx} product={product} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-5">
      <span className="typing-dot"/>
      <span className="typing-dot"/>
      <span className="typing-dot"/>
    </div>
  );
}
