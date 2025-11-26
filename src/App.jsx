import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Newspaper, Video, RefreshCw, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Import Bebas Neue font
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
  .bebas-title {
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 0.05em;
  }
`;
document.head.appendChild(styleTag);

export default function CryptoAggregator() {
  const [activeTab, setActiveTab] = useState('prices');
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [videoCategory, setVideoCategory] = useState('bitcoin');
  const [chartTimeframe, setChartTimeframe] = useState('7');

  useEffect(() => {
    fetchCryptoPrices();
  }, []);

  useEffect(() => {
    if (activeTab === 'news' && news.length === 0) {
      fetchCryptoNews();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'videos' && Object.keys(videos).length === 0) {
      fetchCryptoVideos();
    }
  }, [activeTab]);

  const fetchCryptoPrices = async () => {
    try {
      // Specific coin IDs for the requested cryptocurrencies
      const coinIds = 'bitcoin,ethereum,ripple,stellar,solana,hedera-hashgraph,cardano,quant-network,ondo-finance,algorand,dogecoin,shiba-inu,pudgy-penguins,xdce-crowd-sale';
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc`);
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
      // Curated news sources from X and crypto news sites with logos
      const curatedNews = [
        { 
          id: 1, 
          title: "Latest Crypto Regulatory Updates", 
          source: { title: "Eleanor Terrett" }, 
          logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          url: "https://x.com/EleanorTerrett"
        },
        { 
          id: 2, 
          title: "Macro Market Analysis & Crypto Outlook", 
          source: { title: "Raoul Pal" }, 
          logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          url: "https://x.com/RaoulGMI"
        },
        { 
          id: 3, 
          title: "Ripple Company Updates & Announcements", 
          source: { title: "Brad Garlinghouse" }, 
          logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          url: "https://x.com/bgarlinghouse"
        },
        { 
          id: 4, 
          title: "Coinbase Market Insights & Analysis", 
          source: { title: "Coinbase" }, 
          logo: "https://images.ctfassets.net/c5bd0wqjc7v0/4Y1RS9zV0FhoXfYdVm7vK7/dd9d2e5999e588b30e0c41e8ec4bb77f/coinbase-logo.png",
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          url: "https://www.coinbase.com/blog"
        },
        { 
          id: 5, 
          title: "Cryptocurrency Investment Analysis", 
          source: { title: "The Motley Fool" }, 
          logo: "https://g.foolcdn.com/art/companylogos/mark/MF.png",
          created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          url: "https://www.fool.com/investing/stock-market/market-sectors/financials/cryptocurrency-stocks/"
        },
        { 
          id: 6, 
          title: "Breaking Crypto News & Market Updates", 
          source: { title: "Cointelegraph" }, 
          logo: "https://s3.cointelegraph.com/storage/uploads/view/d34ab2c53068c7d5f3d796b8e95dddb9.png",
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          url: "https://cointelegraph.com/"
        }
      ];
      setNews(curatedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchCryptoVideos = async () => {
    try {
      // Sample videos for each category
      const videosByCategory = {
        bitcoin: [
          { 
            id: 1, 
            title: "Bitcoin Technical Analysis - What's Next?", 
            channel: "Paul Barron",
            views: "125K views",
            url: "https://youtube.com/@PaulBarronNetwork/search?query=bitcoin"
          },
          { 
            id: 2, 
            title: "Bitcoin Market Update 2024", 
            channel: "Andreas Antonopoulos",
            views: "189K views",
            url: "https://youtube.com/@aantonop/search?query=bitcoin"
          },
          { 
            id: 3, 
            title: "Understanding Bitcoin Mining", 
            channel: "Coin Bureau",
            views: "203K views",
            url: "https://youtube.com/@CoinBureau/search?query=bitcoin"
          },
          { 
            id: 4, 
            title: "Bitcoin Deep Dive Interview", 
            channel: "Laura Shin",
            views: "156K views",
            url: "https://youtube.com/@LauraShin/search?query=bitcoin"
          }
        ],
        ethereum: [
          { 
            id: 4, 
            title: "Ethereum 2.0 Complete Guide", 
            channel: "Paul Barron",
            views: "156K views",
            url: "https://youtube.com/@PaulBarronNetwork/search?query=ethereum"
          },
          { 
            id: 5, 
            title: "ETH Price Prediction with Tom Lee", 
            channel: "CNBC",
            views: "192K views",
            url: "https://youtube.com/results?search_query=tom+lee+ethereum"
          },
          { 
            id: 6, 
            title: "Ethereum Market Analysis - Paul Barron", 
            channel: "Paul Barron",
            views: "178K views",
            url: "https://youtube.com/@PaulBarronNetwork/search?query=ethereum"
          },
          { 
            id: 7, 
            title: "Tom Lee on Crypto & Ethereum Future", 
            channel: "Bloomberg",
            views: "214K views",
            url: "https://youtube.com/results?search_query=tom+lee+ethereum"
          }
        ],
        xrp: [
          { 
            id: 7, 
            title: "XRP Legal Victory Analysis", 
            channel: "Zach Rector",
            views: "234K views",
            url: "https://youtube.com/@ZachRector/search?query=xrp"
          },
          { 
            id: 8, 
            title: "Ripple's Global Payment Network", 
            channel: "Crypto Sensei",
            views: "145K views",
            url: "https://youtube.com/@CryptoSensei/search?query=xrp"
          },
          { 
            id: 9, 
            title: "XRP Price Analysis & Updates", 
            channel: "Digital Outlook",
            views: "167K views",
            url: "https://youtube.com/@DigitalOutlook/search?query=xrp"
          },
          { 
            id: 10, 
            title: "XRP Market Developments", 
            channel: "Chain of Blocks",
            views: "189K views",
            url: "https://youtube.com/@ChainofBlocks/search?query=xrp"
          },
          { 
            id: 11, 
            title: "XRP News & Market Updates", 
            channel: "Mickle",
            views: "212K views",
            url: "https://youtube.com/@Mickle/search?query=xrp"
          }
        ],
        altcoins: [
          { 
            id: 11, 
            title: "Top Altcoins to Watch This Week", 
            channel: "Altcoin Daily",
            views: "198K views",
            url: "https://youtube.com/@AltcoinDaily/videos"
          },
          { 
            id: 12, 
            title: "Altcoin Market Analysis & Predictions", 
            channel: "Altcoin Daily",
            views: "142K views",
            url: "https://youtube.com/@AltcoinDaily/videos"
          },
          { 
            id: 13, 
            title: "Crypto Market Breakdown", 
            channel: "Krypto with Klaus",
            views: "176K views",
            url: "https://youtube.com/@KryptowithKlaus/videos"
          },
          { 
            id: 14, 
            title: "Hidden Gem Altcoins", 
            channel: "Krypto with Klaus",
            views: "134K views",
            url: "https://youtube.com/@KryptowithKlaus/videos"
          },
          { 
            id: 15, 
            title: "Best Altcoins for 2025", 
            channel: "Apex Crypto",
            views: "167K views",
            url: "https://youtube.com/@ApexCrypto/videos"
          },
          { 
            id: 16, 
            title: "Altcoin News & Updates", 
            channel: "Apex Crypto",
            views: "145K views",
            url: "https://youtube.com/@ApexCrypto/videos"
          }
        ]
      };
      setVideos(videosByCategory);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchChartData = async (coinId, days = '7') => {
    setChartLoading(true);
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await response.json();
      const formattedData = data.prices.map(([timestamp, price]) => ({
        time: days === '1' 
          ? new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price
      }));
      setChartData(formattedData);
      setChartLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartLoading(false);
    }
  };

  const openChart = (crypto) => {
    setSelectedCrypto(crypto);
    setChartTimeframe('7');
    fetchChartData(crypto.id, '7');
  };

  const changeChartTimeframe = (days) => {
    setChartTimeframe(days);
    fetchChartData(selectedCrypto.id, days);
  };

  const closeChart = () => {
    setSelectedCrypto(null);
    setChartData([]);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="bebas-title text-6xl tracking-tight mb-2 bg-gradient-to-r from-green-400 to-white bg-clip-text text-transparent">
            KRYPTOCURRENT
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-2 rounded-lg backdrop-blur">
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'prices' ? 'bg-green-600' : 'hover:bg-slate-700'
            }`}
          >
            <DollarSign size={18} />
            Prices
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'news' ? 'bg-green-600' : 'hover:bg-slate-700'
            }`}
          >
            <Newspaper size={18} />
            News
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'videos' ? 'bg-green-600' : 'hover:bg-slate-700'
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
                <h2 className="text-xl font-bold">Live Crypto Prices</h2>
                <button 
                  onClick={fetchCryptoPrices}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-lg transition"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
                  <p className="text-gray-400">Loading prices...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {cryptoPrices.map((crypto) => (
                    <div 
                      key={crypto.id} 
                      onClick={() => openChart(crypto)}
                      className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <img src={crypto.image} alt={crypto.name} className="w-6 h-6" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{crypto.name}</h3>
                          <p className="text-xs text-gray-400">{crypto.symbol.toUpperCase()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-bold">${crypto.current_price.toLocaleString()}</p>
                        <div className={`flex items-center gap-1 text-xs ${
                          crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ETF Tracker Section */}
              <div className="mt-6 p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-500/20">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  📊 ETF Tracker
                </h3>
                <p className="text-gray-300 mb-4">
                  Track ETF stats, filings and how much crypto is locked up
                </p>
                <a 
                  href="https://xrp-insights.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition font-semibold"
                >
                  Visit ETF Tracker →
                </a>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Latest Crypto News</h2>
                <button 
                  onClick={fetchCryptoNews}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-lg transition"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {news.map((article) => (
                  <a 
                    key={article.id} 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={article.logo} 
                        alt={article.source?.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white/10"
                        onError={(e) => {
                          e.target.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-2">{article.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{article.source?.title || 'CryptoNews'}</span>
                          <span>•</span>
                          <span>{getTimeAgo(article.created_at)}</span>
                        </div>
                      </div>
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
              <h2 className="text-xl font-bold mb-4">Crypto Videos by Category</h2>
              
              {/* Video Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => setVideoCategory('bitcoin')}
                  className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                    videoCategory === 'bitcoin' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  Bitcoin
                </button>
                <button
                  onClick={() => setVideoCategory('ethereum')}
                  className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                    videoCategory === 'ethereum' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  Ethereum
                </button>
                <button
                  onClick={() => setVideoCategory('xrp')}
                  className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                    videoCategory === 'xrp' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  XRP
                </button>
                <button
                  onClick={() => setVideoCategory('xlm')}
                  className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                    videoCategory === 'xlm' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  Alt Coins
                </button>
              </div>

              <div className="space-y-4">
                {(videoCategory === 'xlm' ? videos.altcoins : videos[videoCategory])?.map((video) => (
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

        {/* Chart Popup Modal */}
        {selectedCrypto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeChart}>
            <div className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10" />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCrypto.name}</h2>
                    <p className="text-gray-400">{selectedCrypto.symbol.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={closeChart}
                  className="p-2 hover:bg-slate-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold">${selectedCrypto.current_price.toLocaleString()}</div>
                <div className={`flex items-center gap-2 text-lg ${
                  selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedCrypto.price_change_percentage_24h > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
                </div>
              </div>

              {/* Chart Timeframe Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => changeChartTimeframe('1')}
                  className={`px-4 py-2 rounded-lg transition ${
                    chartTimeframe === '1' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  1 Day
                </button>
                <button
                  onClick={() => changeChartTimeframe('7')}
                  className={`px-4 py-2 rounded-lg transition ${
                    chartTimeframe === '7' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  1 Week
                </button>
              </div>

              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="animate-spin" size={32} />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis 
                        dataKey="time" 
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        interval="preserveStartEnd"
                        tickMargin={8}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value.toFixed(2)}`}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [`${value.toFixed(2)}`, 'Price']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-gray-400 mb-1">Market Cap</div>
                  <div className="font-semibold">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-gray-400 mb-1">24h High</div>
                  <div className="font-semibold">${selectedCrypto.high_24h?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-gray-400 mb-1">24h Low</div>
                  <div className="font-semibold">${selectedCrypto.low_24h?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-gray-400 mb-1">All-Time High</div>
                  <div className="font-semibold">${selectedCrypto.ath?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}