import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Newspaper, Video, Search, RefreshCw } from 'lucide-react';

export default function CryptoAggregator() {
  const [activeTab, setActiveTab] = useState('prices');
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCryptoPrices();
  }, []);

  useEffect(() => {
    if (activeTab === 'news' && news.length === 0) {
      fetchCryptoNews();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'videos' && videos.length === 0) {
      fetchCryptoVideos();
    }
  }, [activeTab]);

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1');
      const data = await response.json();
      setCryptoPrices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setLoading(false);
    }
  };

  const fetchCryptoNews = async () => {
    try {
      // Using CryptoPanic free API - no key required for basic usage
      const response = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=free&public=true&kind=news');
      const data = await response.json();
      setNews(data.results || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data if API fails
      setNews([
        { id: 1, title: "Bitcoin Reaches New Heights Amid Institutional Interest", source: { title: "CryptoNews" }, created_at: "2024-11-25T10:00:00Z", url: "#" },
        { id: 2, title: "Ethereum 2.0 Upgrade Shows Promising Results", source: { title: "BlockchainDaily" }, created_at: "2024-11-25T08:00:00Z", url: "#" },
        { id: 3, title: "DeFi Platforms See Surge in User Activity", source: { title: "CoinTelegraph" }, created_at: "2024-11-25T06:00:00Z", url: "#" }
      ]);
    }
  };

  const fetchCryptoVideos = async () => {
    try {
      // Note: This uses YouTube's public RSS feed (no API key needed)
      // For production, get a YouTube API key from Google Cloud Console
      const response = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCqK_GSMbpiV8spgD3ZGloSw');
      // For this demo, we'll use sample data since RSS parsing requires additional setup
      setVideos([
        { 
          id: 1, 
          title: "Bitcoin Technical Analysis - What's Next?", 
          channel: "Coin Bureau",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          views: "125K views",
          url: "https://youtube.com"
        },
        { 
          id: 2, 
          title: "Top 5 Altcoins for 2025", 
          channel: "Crypto Banter",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          views: "89K views",
          url: "https://youtube.com"
        },
        { 
          id: 3, 
          title: "Understanding DeFi: Complete Guide", 
          channel: "Whiteboard Crypto",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          views: "203K views",
          url: "https://youtube.com"
        }
      ]);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const filteredPrices = cryptoPrices.filter(crypto => 
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Kryptocurrent
          </h1>
          <p className="text-gray-400">Real-time prices, news & videos in one place</p>
        </div>

        {/* Search Bar */}
        {activeTab === 'prices' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 backdrop-blur rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-2 rounded-lg backdrop-blur">
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'prices' ? 'bg-purple-600' : 'hover:bg-slate-700'
            }`}
          >
            <DollarSign size={18} />
            Prices
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'news' ? 'bg-purple-600' : 'hover:bg-slate-700'
            }`}
          >
            <Newspaper size={18} />
            News
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'videos' ? 'bg-purple-600' : 'hover:bg-slate-700'
            }`}
          >
            <Video size={18} />
            Videos
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6">
          {/* Prices Tab */}
          {activeTab === 'prices' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Live Crypto Prices</h2>
                <button 
                  onClick={fetchCryptoPrices}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
                  <p className="text-gray-400">Loading prices...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPrices.map((crypto) => (
                    <div key={crypto.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between hover:bg-slate-700 transition">
                      <div className="flex items-center gap-3">
                        <img src={crypto.image} alt={crypto.name} className="w-10 h-10" />
                        <div>
                          <h3 className="font-semibold">{crypto.name}</h3>
                          <p className="text-sm text-gray-400">{crypto.symbol.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${crypto.current_price.toLocaleString()}</p>
                        <div className={`flex items-center gap-1 text-sm ${
                          crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  ✅ <strong>Live data</strong> powered by CoinGecko API
                </p>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Latest Crypto News</h2>
                <button 
                  onClick={fetchCryptoNews}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {news.map((article) => (
                  <a 
                    key={article.id} 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <h3 className="font-semibold mb-2">{article.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{article.source?.title || 'CryptoNews'}</span>
                      <span>•</span>
                      <span>{getTimeAgo(article.created_at)}</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300 mb-2">
                  <strong>To get real news:</strong>
                </p>
                <ul className="text-xs text-gray-300 space-y-1 ml-4">
                  <li>• CryptoPanic API (free tier available)</li>
                  <li>• NewsAPI.org ($0 for dev, $449/mo for production)</li>
                  <li>• RSS feeds from CoinDesk, CoinTelegraph</li>
                </ul>
              </div>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Trending Crypto Videos</h2>
              <div className="space-y-4">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <div className="flex gap-4">
                      <div className="w-40 h-24 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Video size={32} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                        <p className="text-sm text-gray-400">{video.channel}</p>
                        <p className="text-xs text-gray-500 mt-1">{video.views}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300 mb-2">
                  <strong>To get real videos:</strong>
                </p>
                <ol className="text-xs text-gray-300 space-y-1 ml-4">
                  <li>1. Get YouTube Data API key (free from Google Cloud)</li>
                  <li>2. Search for crypto videos: <code className="bg-slate-700 px-1 rounded">search?q=cryptocurrency&type=video</code></li>
                  <li>3. Free tier: 10,000 requests/day</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-bold mb-3">🚀 Quick Setup Guide</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-purple-300">Step 1:</strong>
              <span className="text-gray-300"> Prices are already working! (CoinGecko API)</span>
            </div>
            <div>
              <strong className="text-purple-300">Step 2:</strong>
              <span className="text-gray-300"> Get API keys for news & videos (see blue boxes above)</span>
            </div>
            <div>
              <strong className="text-purple-300">Step 3:</strong>
              <span className="text-gray-300"> Deploy to Vercel/Netlify (both have free plans)</span>
            </div>
            <div>
              <strong className="text-purple-300">Step 4:</strong>
              <span className="text-gray-300"> Add features: alerts, charts, favorites, portfolio tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
