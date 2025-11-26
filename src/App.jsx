import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Newspaper, Video, RefreshCw, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
      const videosByCategory = {
        bitcoin: [
          { id: 1, title: "Bitcoin Technical Analysis - What's Next?", channel: "Paul Barron", views: "125K views", url: "https://youtube.com/@PaulBarronNetwork/search?query=bitcoin" },
          { id: 2, title: "Bitcoin Market Update 2024", channel: "Andreas Antonopoulos", views: "189K views", url: "https://youtube.com/@aantonop/search?query=bitcoin" },
          { id: 3, title: "Understanding Bitcoin Mining", channel: "Coin Bureau", views: "203K views", url: "https://youtube.com/@CoinBureau/search?query=bitcoin" },
          { id: 4, title: "Bitcoin Deep Dive Interview", channel: "Laura Shin", views: "156K views", url: "https://youtube.com/@LauraShin/search?query=bitcoin" }
        ],
        ethereum: [
          { id: 4, title: "Ethereum 2.0 Complete Guide", channel: "Paul Barron", views: "156K views", url: "https://youtube.com/@PaulBarronNetwork/search?query=ethereum" },
          { id: 5, title: "ETH Price Prediction with Tom Lee", channel: "CNBC", views: "192K views", url: "https://youtube.com/results?search_query=tom+lee+ethereum" },
          { id: 6, title: "Ethereum Market Analysis - Paul Barron", channel: "Paul Barron", views: "178K views", url: "https://youtube.com/@PaulBarronNetwork/search?query=ethereum" },
          { id: 7, title: "Tom Lee on Crypto & Ethereum Future", channel: "Bloomberg", views: "214K views", url: "https://youtube.com/results?search_query=tom+lee+ethereum" }
        ],
        xrp: [
          { id: 7, title: "XRP Legal Victory Analysis", channel: "Zach Rector", views: "234K views", url: "https://youtube.com/@ZachRector/search?query=xrp" },
          { id: 8, title: "Ripple's Global Payment Network", channel: "Crypto Sensei", views: "145K views", url: "https://youtube.com/@CryptoSensei/search?query=xrp" },
          { id: 9, title: "XRP Price Analysis & Updates", channel: "Digital Outlook", views: "167K views", url: "https://youtube.com/@DigitalOutlook/search?query=xrp" },
          { id: 10, title: "XRP Market Developments", channel: "Chain of Blocks", views: "189K views", url: "https://youtube.com/@ChainofBlocks/search?query=xrp" },
          { id: 11, title: "XRP News & Market Updates", channel: "Mickle", views: "212K views", url: "https://youtube.com/@Mickle/search?query=xrp" }
        ],
        altcoins: [
          { id: 11, title: "Top Altcoins to Watch This Week", channel: "Altcoin Daily", views: "198K views", url: "https://youtube.com/@AltcoinDaily/videos" },
          { id: 12, title: "Altcoin Market Analysis & Predictions", channel: "Altcoin Daily", views: "142K views", url: "https://youtube.com/@AltcoinDaily/videos" },
          { id: 13, title: "Crypto Market Breakdown", channel: "Krypto with Klaus", views: "176K views", url: "https://youtube.com/@KryptowithKlaus/videos" },
          { id: 14, title: "Hidden Gem Altcoins", channel: "Krypto with Klaus", views: "134K views", url: "https://youtube.com/@KryptowithKlaus/videos" },
          { id: 15, title: "Best Altcoins for 2025", channel: "Apex Crypto", views: "167K views", url: "https://youtube.com/@ApexCrypto/videos" },
          { id: 16, title: "Altcoin News & Updates", channel: "Apex Crypto", views: "145K views", url: "https://youtube.com/@ApexCrypto/videos" }
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
    <div className="min-h-screen bg-[#ffc93c] text-[#155263] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8 pt-8">
          <img 
            src="/logo.png" 
            alt="Kryptocurrent Logo" 
            className="mx-auto mb-4"
            style={{ maxWidth: '600px', width: '100%' }}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white/30 p-2 rounded-lg backdrop-blur">
          <button onClick={() => setActiveTab('prices')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'prices' ? 'bg-[#155263] text-white' : 'hover:bg-white/50 text-[#155263]'}`}>
            <DollarSign size={18} />Prices
          </button>
          <button onClick={() => setActiveTab('news')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'news' ? 'bg-[#155263] text-white' : 'hover:bg-white/50 text-[#155263]'}`}>
            <Newspaper size={18} />News
          </button>
          <button onClick={() => setActiveTab('videos')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'videos' ? 'bg-[#155263] text-white' : 'hover:bg-white/50 text-[#155263]'}`}>
            <Video size={18} />Videos
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white/50 backdrop-blur rounded-xl p-6">
          {activeTab === 'prices' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#155263]">Live Crypto Prices</h2>
                <button onClick={fetchCryptoPrices} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#155263] text-white hover:bg-[#1a6b7f] rounded-lg transition">
                  <RefreshCw size={14} />Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-[#155263]" size={32} />
                  <p className="text-[#155263]">Loading prices...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {cryptoPrices.map((crypto) => (
                    <div key={crypto.id} onClick={() => openChart(crypto)} className="bg-white rounded-lg p-3 hover:bg-[#155263] hover:text-white transition cursor-pointer border-2 border-[#155263]">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={crypto.image} alt={crypto.name} className="w-6 h-6" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{crypto.name}</h3>
                          <p className="text-xs opacity-70">{crypto.symbol.toUpperCase()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-bold">${crypto.current_price.toLocaleString()}</p>
                        <div className={`flex items-center gap-1 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ETF Tracker Section */}
              <div className="mt-6 p-6 bg-[#155263] text-white rounded-xl">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">📊 ETF Tracker</h3>
                <p className="mb-4 opacity-90">Track ETF stats, filings and how much crypto is locked up</p>
                <a href="https://xrp-insights.com" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-[#ffc93c] text-[#155263] hover:bg-[#ffb700] rounded-lg transition font-semibold">
                  Visit ETF Tracker →
                </a>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#155263]">Latest Crypto News</h2>
                <button onClick={fetchCryptoNews} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#155263] text-white hover:bg-[#1a6b7f] rounded-lg transition">
                  <RefreshCw size={14} />Refresh
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {news.map((article) => (
                  <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-lg p-4 hover:bg-[#155263] hover:text-white transition cursor-pointer border-2 border-[#155263]">
                    <div className="flex items-start gap-3">
                      <img src={article.logo} alt={article.source?.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white/10" onError={(e) => { e.target.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'; }} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-2">{article.title}</h3>
                        <div className="flex items-center gap-4 text-sm opacity-70">
                          <span>{article.source?.title || 'CryptoNews'}</span>
                          <span>•</span>
                          <span>{getTimeAgo(article.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-[#155263]">
                <p className="text-sm text-[#155263] font-semibold mb-2">To get real news:</p>
                <ul className="text-xs text-[#155263] space-y-1 ml-4 opacity-80">
                  <li>• CryptoPanic API (free tier available)</li>
                  <li>• NewsAPI.org ($0 for dev, $449/mo for production)</li>
                  <li>• RSS feeds from CoinDesk, CoinTelegraph</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-[#155263]">Crypto Videos by Category</h2>
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button onClick={() => setVideoCategory('bitcoin')} className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${videoCategory === 'bitcoin' ? 'bg-[#155263] text-white' : 'bg-white hover:bg-[#155263] hover:text-white text-[#155263]'}`}>Bitcoin</button>
                <button onClick={() => setVideoCategory('ethereum')} className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${videoCategory === 'ethereum' ? 'bg-[#155263] text-white' : 'bg-white hover:bg-[#155263] hover:text-white text-[#155263]'}`}>Ethereum</button>
                <button onClick={() => setVideoCategory('xrp')} className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${videoCategory === 'xrp' ? 'bg-[#155263] text-white' : 'bg-white hover:bg-[#155263] hover:text-white text-[#155263]'}`}>XRP</button>
                <button onClick={() => setVideoCategory('xlm')} className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${videoCategory === 'xlm' ? 'bg-[#155263] text-white' : 'bg-white hover:bg-[#155263] hover:text-white text-[#155263]'}`}>Alt Coins</button>
              </div>
              <div className="space-y-4">
                {(videoCategory === 'xlm' ? videos.altcoins : videos[videoCategory])?.map((video) => (
                  <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-lg p-4 hover:bg-[#155263] hover:text-white transition cursor-pointer border-2 border-[#155263]">
                    <div className="flex gap-4">
                      <div className="w-40 h-24 bg-[#155263] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Video size={32} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                        <p className="text-sm opacity-70">{video.channel}</p>
                        <p className="text-xs opacity-60 mt-1">{video.views}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-[#155263]">
                <p className="text-sm text-[#155263] font-semibold mb-2">To get real videos:</p>
                <ol className="text-xs text-[#155263] space-y-1 ml-4 opacity-80">
                  <li>1. Get YouTube Data API key (free from Google Cloud)</li>
                  <li>2. Search for crypto videos: <code className="bg-[#ffc93c] px-1 rounded">search?q=cryptocurrency&type=video</code></li>
                  <li>3. Free tier: 10,000 requests/day</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Chart Popup Modal */}
        {selectedCrypto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeChart}>
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10" />
                  <div>
                    <h2 className="text-2xl font-bold text-[#155263]">{selectedCrypto.name}</h2>
                    <p className="text-gray-600">{selectedCrypto.symbol.toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={closeChart} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={24} className="text-[#155263]" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-[#155263]">${selectedCrypto.current_price.toLocaleString()}</div>
                <div className={`flex items-center gap-2 text-lg ${selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCrypto.price_change_percentage_24h > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => changeChartTimeframe('1')} className={`px-4 py-2 rounded-lg transition ${chartTimeframe === '1' ? 'bg-[#155263] text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#155263]'}`}>1 Day</button>
                <button onClick={() => changeChartTimeframe('7')} className={`px-4 py-2 rounded-lg transition ${chartTimeframe === '7' ? 'bg-[#155263] text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#155263]'}`}>1 Week</button>
              </div>

              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-[#155263]" size={32} />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#155263" style={{ fontSize: '11px' }} interval="preserveStartEnd" tickMargin={5} minTickGap={50} />
                      <YAxis stroke="#155263" style={{ fontSize: '11px' }} tickFormatter={(value) => `$${value.toFixed(2)}`} width={70} domain={['auto', 'auto']} scale="linear" />
                      <Tooltip contentStyle={{ backgroundColor: '#155263', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => [`$${value.toFixed(2)}`, 'Price']} />
                      <Line type="monotone" dataKey="price" stroke="#155263" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-[#155263] opacity-70 mb-1">Market Cap</div>
                  <div className="font-semibold text-[#155263]">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</div>
                </div>
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-[#155263] opacity-70 mb-1">24h High</div>
                  <div className="font-semibold text-[#155263]">${selectedCrypto.high_24h?.toLocaleString()}</div>
                </div>
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-[#155263] opacity-70 mb-1">24h Low</div>
                  <div className="font-semibold text-[#155263]">${selectedCrypto.low_24h?.toLocaleString()}</div>
                </div>
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-[#155263] opacity-70 mb-1">All-Time High</div>
                  <div className="font-semibold text-[#155263]">${selectedCrypto.ath?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}