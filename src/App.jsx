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
    if (activeTab === 'videos' && videos.length === 0) {
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
        { id: 1, title: "Latest Crypto Regulatory Updates", source: { title: "Eleanor Terrett" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), url: "https://x.com/EleanorTerrett" },
        { id: 2, title: "Macro Market Analysis & Crypto Outlook", source: { title: "Raoul Pal" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RaoulGMI" },
        { id: 3, title: "Ripple Company Updates & Announcements", source: { title: "Brad Garlinghouse" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), url: "https://x.com/bgarlinghouse" },
        { id: 4, title: "Coinbase Market Insights & Analysis", source: { title: "Coinbase" }, logo: "https://images.ctfassets.net/c5bd0wqjc7v0/4Y1RS9zV0FhoXfYdVm7vK7/dd9d2e5999e588b30e0c41e8ec4bb77f/coinbase-logo.png", created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), url: "https://www.coinbase.com/blog" },
        { id: 5, title: "Cryptocurrency Investment Analysis", source: { title: "The Motley Fool" }, logo: "https://g.foolcdn.com/art/companylogos/mark/MF.png", created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), url: "https://www.fool.com/investing/stock-market/market-sectors/financials/cryptocurrency-stocks/" },
        { id: 6, title: "Breaking Crypto News & Market Updates", source: { title: "Cointelegraph" }, logo: "https://s3.cointelegraph.com/storage/uploads/view/d34ab2c53068c7d5f3d796b8e95dddb9.png", created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), url: "https://cointelegraph.com/" }
      ];
      setNews(curatedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchCryptoVideos = async () => {
    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!API_KEY) {
        throw new Error('Using fallback data');
      }
      
      const channels = {
        'Digital Outlook': 'UCG9sTui02o3W4CbHQIP-l7g',
        'Crypto Sensei': 'UCdAz9h6B4j48m_Z-5q0GehA',
        'Mickle': 'UCso1Kc8PyU4KyUpkmNnABqQ',
        'Chain of Blocks': 'UCftxsv8P_Hz32KJuiVQ_0Wg',
        'Zach Rector': 'UC4LwOm1guXDzPPGWnq_YlsA',
        'Jake Claver': 'UCso1Kc8PyU4KyUpkmNnABqQ',
        'Altcoin Daily': 'UC7KjtEJT6HvI3kBcF2I4vXg',
        'Paul Barron': 'UC4VPa7EOvObpyCRI4YKRQRw',
        'Apex Crypto': 'UCszbTlu2HnXA94LGBWMAfug',
        'Good Evening Crypto': 'UCEALkfpMmmWQkGXWhRUmslA',
        'Black Swan Capitalist': 'UCURoln2BKCvvMT5peanKAvw',
        'Crypto with Klaus': 'UCOb8ZvB7CK7-IEf-8RmhULg'
      };

      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const publishedAfter = yesterday.toISOString();

      const allVideos = [];
      let videoId = 1;

      for (const [channelName, channelId] of Object.entries(channels)) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video&publishedAfter=${publishedAfter}`
          );
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
              const publishedDate = new Date(item.snippet.publishedAt);
              const hoursAgo = Math.floor((new Date() - publishedDate) / (1000 * 60 * 60));
              const timeAgo = hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
              
              allVideos.push({
                id: videoId++,
                title: item.snippet.title,
                channel: channelName,
                views: timeAgo,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnail: item.snippet.thumbnails.medium.url,
                publishedAt: item.snippet.publishedAt
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching videos for ${channelName}:`, error);
        }
      }

      allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setVideos(allVideos);
    } catch (error) {
      const fallbackVideos = [
        { id: 1, title: "Latest Crypto Analysis", channel: "Zach Rector", views: "2h ago", url: "https://youtube.com/@Rector94/videos" },
        { id: 2, title: "Market Update", channel: "Crypto Sensei", views: "4h ago", url: "https://youtube.com/@CryptoSenseii/videos" },
        { id: 3, title: "Blockchain News", channel: "Chain of Blocks", views: "6h ago", url: "https://youtube.com/@AChainofBlocks/videos" },
        { id: 4, title: "Bitcoin Analysis", channel: "Paul Barron", views: "8h ago", url: "https://youtube.com/@PaulBarronNetwork/videos" }
      ];
      setVideos(fallbackVideos);
    }
  };

  const fetchChartData = async (coinId, days = '7') => {
    setChartLoading(true);
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await response.json();
      const formattedData = data.prices.map(([timestamp, price]) => ({
        time: days === '1' ? new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-[#ffc93c] py-6 mb-8">
          <div className="max-w-2xl mx-auto px-4">
            <img src="/logo.png" alt="Kryptocurrent Logo" className="w-full" />
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-slate-800/50 p-2 rounded-lg backdrop-blur">
          <button onClick={() => setActiveTab('prices')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'prices' ? 'bg-[#ffc93c] text-black' : 'hover:bg-slate-700 text-white'}`}>
            <DollarSign size={18} />Prices
          </button>
          <button onClick={() => setActiveTab('news')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'news' ? 'bg-[#ffc93c] text-black' : 'hover:bg-slate-700 text-white'}`}>
            <Newspaper size={18} />News
          </button>
          <button onClick={() => setActiveTab('videos')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'videos' ? 'bg-[#ffc93c] text-black' : 'hover:bg-slate-700 text-white'}`}>
            <Video size={18} />Videos
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6">
          {activeTab === 'prices' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Live Crypto Prices</h2>
                <button onClick={fetchCryptoPrices} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition">
                  <RefreshCw size={14} />Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-[#ffc93c]" size={32} />
                  <p className="text-gray-400">Loading prices...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {cryptoPrices.map((crypto) => (
                    <div key={crypto.id} onClick={() => openChart(crypto)} className="bg-slate-700/50 rounded-lg p-2 hover:bg-slate-700 transition cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img src={crypto.image} alt={crypto.name} className="w-5 h-5 flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-xs truncate">{crypto.symbol.toUpperCase()}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold whitespace-nowrap">${crypto.current_price.toLocaleString()}</p>
                          <div className={`flex items-center justify-end gap-0.5 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-6 bg-slate-700/50 rounded-xl">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
                  <img src="/xrp-icon.png" alt="XRP" className="w-6 h-6" />
                  XRP ETF Tracker
                </h3>
                <p className="mb-4 text-gray-300">Track ETF stats, filings and how much XRP is locked up thanks to our friends at XRP-Insights.com</p>
                <a href="https://xrp-insights.com" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold">
                  Visit ETF Tracker →
                </a>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Latest Crypto News</h2>
                <button onClick={fetchCryptoNews} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition">
                  <RefreshCw size={14} />Refresh
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {news.map((article) => (
                  <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer">
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
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-[#ffc93c] font-semibold mb-2">To get real news:</p>
                <ul className="text-xs text-gray-300 space-y-1 ml-4">
                  <li>• CryptoPanic API (free tier available)</li>
                  <li>• NewsAPI.org ($0 for dev, $449/mo for production)</li>
                  <li>• RSS feeds from CoinDesk, CoinTelegraph</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-white">Latest Crypto Videos</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer">
                    <div className="flex gap-4">
                      <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <Video size={28} className="text-[#ffc93c]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 line-clamp-2 text-sm">{video.title}</h3>
                        <p className="text-xs opacity-70">{video.channel}</p>
                        <p className="text-xs opacity-60 mt-1">{video.views}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedCrypto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeChart}>
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10" />
                  <div>
                    <h2 className="text-2xl font-bold text-black">{selectedCrypto.name}</h2>
                    <p className="text-gray-600">{selectedCrypto.symbol.toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={closeChart} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={24} className="text-black" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-black">${selectedCrypto.current_price.toLocaleString()}</div>
                <div className={`flex items-center gap-2 text-lg ${selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCrypto.price_change_percentage_24h > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => changeChartTimeframe('1')} className={`px-4 py-2 rounded-lg transition ${chartTimeframe === '1' ? 'bg-[#ffc93c] text-black' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>1 Day</button>
                <button onClick={() => changeChartTimeframe('7')} className={`px-4 py-2 rounded-lg transition ${chartTimeframe === '7' ? 'bg-[#ffc93c] text-black' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>1 Week</button>
              </div>

              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-[#ffc93c]" size={32} />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#000" style={{ fontSize: '11px' }} interval="preserveStartEnd" tickMargin={5} minTickGap={50} />
                      <YAxis stroke="#000" style={{ fontSize: '11px' }} tickFormatter={(value) => `$${value.toFixed(2)}`} width={70} domain={['auto', 'auto']} scale="linear" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => [`$${value.toFixed(2)}`, 'Price']} />
                      <Line type="monotone" dataKey="price" stroke="#ffc93c" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-black opacity-70 mb-1">Market Cap</div>
                  <div className="font-semibold text-black">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</div>
                </div>
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-black opacity-70 mb-1">24h High</div>
                  <div className="font-semibold text-black">${selectedCrypto.high_24h?.toLocaleString()}</div>
                </div>
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-black opacity-70 mb-1">24h Low</div>
                  <div className="font-semibold text-black">${selectedCrypto.low_24h?.toLocaleString()}</div>
                </div>
                <div className="bg-[#ffc93c] p-3 rounded-lg">
                  <div className="text-black opacity-70 mb-1">All-Time High</div>
                  <div className="font-semibold text-black">${selectedCrypto.ath?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}