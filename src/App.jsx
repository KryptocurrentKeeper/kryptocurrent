import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoAggregator() {
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7');
  const [pricesExpanded, setPricesExpanded] = useState(false);
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [articlesExpanded, setArticlesExpanded] = useState(false);

  useEffect(() => {
    fetchCryptoPrices();
    fetchCryptoNews();
    fetchCryptoVideos();
    fetchCryptoArticles();
    
    // Load Twitter widgets script
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      // Fetch top 102 most popular cryptocurrencies by market cap from CoinGecko
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=102&page=1`);
      const data = await response.json();
      setCryptoPrices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setLoading(false);
    }
  };

  const fetchCryptoNews = async () => {
    const xUpdates = [
      { id: 1, title: "Latest Crypto Updates", source: { title: "Eleanor Terrett" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), url: "https://x.com/EleanorTerrett" },
      { id: 2, title: "Crypto Technology Insights", source: { title: "The Crypto Geek" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), url: "https://x.com/the_Cryptogeek" },
      { id: 3, title: "Crypto Market Analysis", source: { title: "CryptoWendyO" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), url: "https://x.com/CryptoWendyO" },
      { id: 4, title: "XRP News & Updates", source: { title: "RyleXRP" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RuleXRP" },
      { id: 5, title: "Macro Market Insights", source: { title: "Raoul Pal" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RaoulGMI" },
      { id: 6, title: "Crypto Legal Updates", source: { title: "Brian Armstrong" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), url: "https://x.com/brian_armstrong" },
      { id: 7, title: "DeFi & Crypto Insights", source: { title: "Intocryptoverse" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), url: "https://x.com/intocryptoverse" },
      { id: 8, title: "Crypto Law & Regulation", source: { title: "CryptoLawUS" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), url: "https://x.com/CryptoLawUS" },
      { id: 9, title: "Market Updates & Analysis", source: { title: "Eleanor Terrett" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), url: "https://x.com/EleanorTerrett" },
      { id: 10, title: "Blockchain Developments", source: { title: "The Crypto Geek" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), url: "https://x.com/the_Cryptogeek" },
      { id: 11, title: "Trading Insights", source: { title: "CryptoWendyO" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), url: "https://x.com/CryptoWendyO" },
      { id: 12, title: "Crypto Market Commentary", source: { title: "Raoul Pal" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RaoulGMI" }
    ];
    setNews(xUpdates);
  };

  const fetchCryptoArticles = async () => {
    try {
      const rssFeeds = [
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', logo: 'https://www.coindesk.com/favicon.ico' },
        { url: 'https://cryptoslate.com/feed/', source: 'CryptoSlate', logo: 'https://cryptoslate.com/wp-content/themes/cryptoslate-2020/imgsv2/favicon.png' },
        { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph', logo: 'https://s3.cointelegraph.com/storage/uploads/view/d34ab2c53068c7d5f3d796b8e95dddb9.png' },
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk Markets', logo: 'https://www.coindesk.com/favicon.ico' }
      ];

      const allArticles = [];
      let articleId = 1;

      // Fetch from each RSS feed using RSS2JSON
      for (const feed of rssFeeds) {
        try {
          const response = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&api_key=4kwuv0gvyduofgawlqiuzgbbhxfoxztfabatqows&count=10`
          );
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data.status === 'ok' && data.items) {
            data.items.forEach(item => {
              allArticles.push({
                id: articleId++,
                title: item.title,
                source: feed.source,
                logo: feed.logo,
                created_at: item.pubDate,
                url: item.link
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching ${feed.source}:`, error);
        }
      }

      // Sort by latest
      allArticles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Take top 10
      const topArticles = allArticles.slice(0, 10);
      
      if (topArticles.length > 0) {
        setArticles(topArticles);
        console.log(`✓ Fetched ${topArticles.length} articles from RSS feeds`);
      } else {
        // Fallback to static articles if RSS fails
        setArticles(getFallbackArticles());
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles(getFallbackArticles());
    }
  };

  const getFallbackArticles = () => {
    return [
      { id: 1, title: "Bitcoin Market Analysis", source: "CoinDesk", logo: "https://www.coindesk.com/favicon.ico", created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), url: "https://www.coindesk.com/markets/" },
      { id: 2, title: "Ethereum Price Prediction", source: "The Motley Fool", logo: "https://g.foolcdn.com/art/companylogos/mark/MF.png", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), url: "https://www.fool.com/investing/stock-market/market-sectors/financials/cryptocurrency-stocks/" },
      { id: 3, title: "Crypto Trading Tips", source: "Yahoo Finance", logo: "https://s.yimg.com/cv/apiv2/default/icons/favicon_y19_32x32.ico", created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), url: "https://finance.yahoo.com/topic/crypto/" },
      { id: 4, title: "Blockchain Technology News", source: "CryptoSlate", logo: "https://cryptoslate.com/wp-content/themes/cryptoslate-2020/imgsv2/favicon.png", created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), url: "https://cryptoslate.com/" },
      { id: 5, title: "DeFi Market Updates", source: "Crypto News", logo: "https://crypto.news/favicon.ico", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), url: "https://crypto.news/" },
      { id: 6, title: "NFT Market Trends", source: "Cointribune", logo: "https://www.cointribune.com/app/uploads/2021/11/cropped-fav-512-192x192.png", created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), url: "https://www.cointribune.com/en/" },
      { id: 7, title: "Altcoin Investment Guide", source: "CoinDesk", logo: "https://www.coindesk.com/favicon.ico", created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), url: "https://www.coindesk.com/learn/" },
      { id: 8, title: "Crypto Regulation News", source: "Yahoo Finance", logo: "https://s.yimg.com/cv/apiv2/default/icons/favicon_y19_32x32.ico", created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), url: "https://finance.yahoo.com/topic/crypto/" },
      { id: 9, title: "Market Analysis Report", source: "CryptoSlate", logo: "https://cryptoslate.com/wp-content/themes/cryptoslate-2020/imgsv2/favicon.png", created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), url: "https://cryptoslate.com/price/" },
      { id: 10, title: "Latest Crypto Insights", source: "The Motley Fool", logo: "https://g.foolcdn.com/art/companylogos/mark/MF.png", created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), url: "https://www.fool.com/investing/stock-market/market-sectors/financials/cryptocurrency-stocks/" }
    ];
  };

  const fetchCryptoVideos = async () => {
    // Check if we have cached videos that are less than 60 minutes old
    const cachedData = localStorage.getItem('kryptocurrent_videos');
    const cacheTimestamp = localStorage.getItem('kryptocurrent_videos_timestamp');
    
    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      const sixtyMinutes = 60 * 60 * 1000; // 60 minutes in milliseconds
      
      if (cacheAge < sixtyMinutes) {
        console.log(`✓ Using cached videos (${Math.floor(cacheAge / 60000)} minutes old)`);
        setVideos(JSON.parse(cachedData));
        return;
      } else {
        console.log('Cache expired (>60 min), fetching fresh videos...');
      }
    }
    
    const fallbackVideos = [
      { id: 1, title: "Latest XRP Analysis & Market Update", channel: "Zach Rector", views: "2h ago", url: "https://youtube.com/@Rector94/videos", thumbnail: null },
      { id: 2, title: "Crypto Market Weekly Breakdown", channel: "Crypto Sensei", views: "4h ago", url: "https://youtube.com/@CryptoSenseii/videos", thumbnail: null },
      { id: 3, title: "Blockchain Technology Deep Dive", channel: "Chain of Blocks", views: "6h ago", url: "https://youtube.com/@AChainofBlocks/videos", thumbnail: null },
      { id: 4, title: "Bitcoin Price Analysis & Predictions", channel: "Paul Barron", views: "8h ago", url: "https://youtube.com/@PaulBarronNetwork/videos", thumbnail: null },
      { id: 5, title: "Top Altcoins Review This Week", channel: "Altcoin Daily", views: "10h ago", url: "https://youtube.com/@AltcoinDaily/videos", thumbnail: null },
      { id: 6, title: "Market Trends & Trading Signals", channel: "Digital Outlook", views: "12h ago", url: "https://youtube.com/@DigitalOutlookChannel/videos", thumbnail: null },
      { id: 7, title: "Mickle's Crypto Insights", channel: "Mickle", views: "14h ago", url: "https://youtube.com/@MickleXRP/videos", thumbnail: null },
      { id: 8, title: "Jake Claver Market Review", channel: "Jake Claver", views: "16h ago", url: "https://youtube.com/@jakeclaver/videos", thumbnail: null },
      { id: 9, title: "Apex Crypto Weekly Update", channel: "Apex Crypto", views: "18h ago", url: "https://youtube.com/@ApexCryptoInsights/videos", thumbnail: null },
      { id: 10, title: "Good Evening Crypto News", channel: "Good Evening Crypto", views: "20h ago", url: "https://youtube.com/@GoodEveningCrypto/videos", thumbnail: null },
      { id: 11, title: "Black Swan Market Analysis", channel: "Black Swan Capitalist", views: "22h ago", url: "https://youtube.com/@BlackSwanCapitalist/videos", thumbnail: null },
      { id: 12, title: "Klaus Crypto Updates", channel: "Crypto with Klaus", views: "1d ago", url: "https://youtube.com/@FamilyHobbiesandCards/videos", thumbnail: null }
    ];

    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!API_KEY) {
        console.log('No API key, using fallback videos');
        setVideos(fallbackVideos);
        return;
      }
      
      const channels = {
        'Digital Outlook': 'UC8oW_3rV35rZ3oU1F_n9cjg',
        'Crypto Sensei': 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        'Mickle': 'UCINUlGW2QpPYa9-TGcW2XUA',
        'Chain of Blocks': 'UCx1J1fFL7gzhd8BqjJ_jJxw',
        'Zach Rector': 'UC4LwOm1guXDzPPGWnq_YlsA',
        'Jake Claver': 'UC0zq9i-Um0YB-ssHQoz_qUg',
        'Altcoin Daily': 'UCVm8QxSChzT63-zF2A7AWEQ',
        'Paul Barron': 'UCwB6d4tB5-S1tZc1r3_B-fQ',
        'Apex Crypto': 'UCQ0lC-yRj8Bwz8eFv290_LA',
        'Good Evening Crypto': 'UCEALkfpMmmWQkGXWhRUmslA',
        'Black Swan Capitalist': 'UCURoln2BKCvvMT5peanKAvw',
        'Crypto with Klaus': 'UCOb8ZvB7CK7-IEf-8RmhULg'
      };

      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const publishedAfter = yesterday.toISOString();

      const allVideos = [];
      let videoId = 1;
      let successfulChannels = 0;
      let failedChannels = 0;

      for (const [channelName, channelId] of Object.entries(channels)) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}`
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ YouTube API error for ${channelName}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            failedChannels++;
            continue;
          }
          
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            console.log(`✓ Found ${data.items.length} videos from ${channelName} in last 24h`);
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
            successfulChannels++;
          } else {
            console.log(`- No videos from ${channelName} in last 24h`);
            successfulChannels++;
          }
        } catch (channelError) {
          console.error(`❌ Error fetching ${channelName}:`, channelError);
          failedChannels++;
        }
      }
      
      console.log(`Total: ${allVideos.length} videos from ${successfulChannels}/${channels.length} channels (${failedChannels} failed)`);

      allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      console.log(`Fetched ${allVideos.length} videos from YouTube API`);
      
      if (allVideos.length > 0) {
        setVideos(allVideos);
      } else {
        console.log('No videos found from API, using fallback');
        setVideos(fallbackVideos);
      }
    } catch (error) {
      console.log('Error fetching videos, using fallback:', error.message);
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
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Desktop: show 24 prices unless expanded, Mobile: show 4 prices unless expanded
  // News: show 4 unless expanded
  // Videos: show 4 unless expanded
  // Articles: show 4 unless expanded
  const displayedPrices = pricesExpanded ? cryptoPrices : cryptoPrices.slice(0, 24);
  const displayedNews = newsExpanded ? news : news.slice(0, 4);
  const displayedVideos = videosExpanded ? videos : videos.slice(0, 4);
  const displayedArticles = articlesExpanded ? articles : articles.slice(0, 4);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-[#ffc93c] py-6 mb-8">
          <div className="max-w-2xl mx-auto px-4">
            <img src="/logo.png" alt="Kryptocurrent Logo" className="w-full" />
          </div>
        </div>

        {/* Prices Section */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
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
            <>
              {/* Mobile: Show 4 with expand button */}
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {(pricesExpanded ? cryptoPrices : cryptoPrices.slice(0, 4)).map((crypto) => (
                    <div key={crypto.id} onClick={() => openChart(crypto)} className="bg-slate-700/50 rounded-lg p-1.5 hover:bg-slate-700 transition cursor-pointer">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <img src={crypto.image} alt={crypto.name} className="w-4 h-4 flex-shrink-0" />
                          <h3 className="font-semibold text-xs truncate">{crypto.symbol.toUpperCase()}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold whitespace-nowrap">
                            ${crypto.current_price < 0.01 
                              ? crypto.current_price.toFixed(8) 
                              : crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className={`flex items-center justify-end gap-0.5 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            <span className="text-xs">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cryptoPrices.length > 4 && (
                  <button 
                    onClick={() => setPricesExpanded(!pricesExpanded)}
                    className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
                  >
                    {pricesExpanded ? 'Show Less' : 'Show Top 100'}
                  </button>
                )}
              </div>

              {/* Desktop: Show 24 with expand button */}
              <div className="hidden md:block">
                <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {displayedPrices.map((crypto) => (
                    <div key={crypto.id} onClick={() => openChart(crypto)} className="bg-slate-700/50 rounded-lg p-1.5 hover:bg-slate-700 transition cursor-pointer">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <img src={crypto.image} alt={crypto.name} className="w-4 h-4 flex-shrink-0" />
                          <h3 className="font-semibold text-xs truncate">{crypto.symbol.toUpperCase()}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold whitespace-nowrap">
                            ${crypto.current_price < 0.01 
                              ? crypto.current_price.toFixed(8) 
                              : crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className={`flex items-center justify-end gap-0.5 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            <span className="text-xs">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cryptoPrices.length > 24 && (
                  <button 
                    onClick={() => setPricesExpanded(!pricesExpanded)}
                    className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
                  >
                    {pricesExpanded ? 'Show Less' : 'Show Top 100'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ETF Tracker */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <img src="/XRPlogo.jpg" alt="XRP" className="w-8 h-8 rounded" />
                <div>
                  <h3 className="text-lg font-bold text-white">XRP ETF Tracker</h3>
                  <p className="text-sm text-gray-300 hidden md:block">Track spot ETF stats from our good friends at XRP Insights</p>
                </div>
              </div>
              <a href="https://xrp-insights.com" target="_blank" rel="noopener noreferrer" className="px-4 md:px-6 py-2 md:py-3 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold whitespace-nowrap text-sm md:text-base">
                Visit →
              </a>
            </div>
          </div>
        </div>

        {/* Updates from X Section - Individual Feeds */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Updates from X</h2>
            <button 
              onClick={() => {
                if (window.twttr && window.twttr.widgets) {
                  window.twttr.widgets.load();
                }
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition"
            >
              <RefreshCw size={14} />Refresh
            </button>
          </div>
          
          {/* Show 2 feeds side by side to reduce rate limiting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Eleanor Terrett */}
            <div className="bg-slate-700/50 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                <a href="https://twitter.com/EleanorTerrett" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                  @EleanorTerrett
                </a>
                <a href="https://twitter.com/EleanorTerrett" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                  View Profile →
                </a>
              </div>
              <a 
                className="twitter-timeline" 
                data-height="500"
                data-theme="dark"
                href="https://twitter.com/EleanorTerrett?ref_src=twsrc%5Etfw"
              >
                Posts by @EleanorTerrett
              </a>
            </div>

            {/* CryptoWendyO */}
            <div className="bg-slate-700/50 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                <a href="https://twitter.com/CryptoWendyO" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                  @CryptoWendyO
                </a>
                <a href="https://twitter.com/CryptoWendyO" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                  View Profile →
                </a>
              </div>
              <a 
                className="twitter-timeline" 
                data-height="500"
                data-theme="dark"
                href="https://twitter.com/CryptoWendyO?ref_src=twsrc%5Etfw"
              >
                Posts by @CryptoWendyO
              </a>
            </div>
          </div>

          {/* More feeds when expanded */}
          {newsExpanded && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* The Crypto Geek */}
                <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                    <a href="https://twitter.com/the_Cryptogeek" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                      @the_Cryptogeek
                    </a>
                    <a href="https://twitter.com/the_Cryptogeek" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                      View Profile →
                    </a>
                  </div>
                  <a 
                    className="twitter-timeline" 
                    data-height="500"
                    data-theme="dark"
                    href="https://twitter.com/the_Cryptogeek?ref_src=twsrc%5Etfw"
                  >
                    Posts by @the_Cryptogeek
                  </a>
                </div>

                {/* Raoul Pal */}
                <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                    <a href="https://twitter.com/RaoulGMI" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                      @RaoulGMI
                    </a>
                    <a href="https://twitter.com/RaoulGMI" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                      View Profile →
                    </a>
                  </div>
                  <a 
                    className="twitter-timeline" 
                    data-height="500"
                    data-theme="dark"
                    href="https://twitter.com/RaoulGMI?ref_src=twsrc%5Etfw"
                  >
                    Posts by @RaoulGMI
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* RyleXRP */}
                <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                    <a href="https://twitter.com/RuleXRP" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                      @RyleXRP
                    </a>
                    <a href="https://twitter.com/RuleXRP" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                      View Profile →
                    </a>
                  </div>
                  <a 
                    className="twitter-timeline" 
                    data-height="500"
                    data-theme="dark"
                    href="https://twitter.com/RuleXRP?ref_src=twsrc%5Etfw"
                  >
                    Posts by @RyleXRP
                  </a>
                </div>

                {/* Brian Armstrong */}
                <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                    <a href="https://twitter.com/brian_armstrong" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                      @brian_armstrong
                    </a>
                    <a href="https://twitter.com/brian_armstrong" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                      View Profile →
                    </a>
                  </div>
                  <a 
                    className="twitter-timeline" 
                    data-height="500"
                    data-theme="dark"
                    href="https://twitter.com/brian_armstrong?ref_src=twsrc%5Etfw"
                  >
                    Posts by @brian_armstrong
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Intocryptoverse */}
                <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                    <a href="https://twitter.com/intocryptoverse" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                      @intocryptoverse
                    </a>
                    <a href="https://twitter.com/intocryptoverse" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                      View Profile →
                    </a>
                  </div>
                  <a 
                    className="twitter-timeline" 
                    data-height="500"
                    data-theme="dark"
                    href="https://twitter.com/intocryptoverse?ref_src=twsrc%5Etfw"
                  >
                    Posts by @intocryptoverse
                  </a>
                </div>

                {/* CryptoLawUS */}
                <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-600 flex items-center justify-between">
                    <a href="https://twitter.com/CryptoLawUS" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-[#ffc93c] transition">
                      @CryptoLawUS
                    </a>
                    <a href="https://twitter.com/CryptoLawUS" target="_blank" rel="noopener noreferrer" className="text-xs text-[#ffc93c] hover:underline">
                      View Profile →
                    </a>
                  </div>
                  <a 
                    className="twitter-timeline" 
                    data-height="500"
                    data-theme="dark"
                    href="https://twitter.com/CryptoLawUS?ref_src=twsrc%5Etfw"
                  >
                    Posts by @CryptoLawUS
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Expand button */}
          <button 
            onClick={() => {
              setNewsExpanded(!newsExpanded);
              // Reload Twitter widgets after expanding
              setTimeout(() => {
                if (window.twttr && window.twttr.widgets) {
                  window.twttr.widgets.load();
                }
              }, 200);
            }}
            className="mt-4 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
          >
            {newsExpanded ? 'Show Less' : 'Show more posts'}
          </button>
        </div>

        {/* Videos Section - 2 Columns on Desktop, Expandable on Mobile */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Latest Crypto Videos</h2>
          
          {/* Mobile: Show 4 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {displayedVideos.map((video) => (
                <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">▶️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm">{video.title}</h3>
                      <p className="text-xs opacity-70">{video.channel}</p>
                      <p className="text-xs opacity-60 mt-1">{video.views}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {videos.length > 4 && (
              <button 
                onClick={() => setVideosExpanded(!videosExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {videosExpanded ? 'Show Less' : 'Show more videos'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {displayedVideos.map((video) => (
                <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">▶️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm">{video.title}</h3>
                      <p className="text-xs opacity-70">{video.channel}</p>
                      <p className="text-xs opacity-60 mt-1">{video.views}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {videos.length > 4 && (
              <button 
                onClick={() => setVideosExpanded(!videosExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {videosExpanded ? 'Show Less' : 'Show more videos'}
              </button>
            )}
          </div>
        </div>

        {/* Articles Section - 2 Columns on Desktop, Expandable on Mobile */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Crypto Articles</h2>
            <button onClick={fetchCryptoArticles} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition">
              <RefreshCw size={14} />Refresh
            </button>
          </div>
          
          {/* Mobile: Show 4 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {displayedArticles.map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <img src={article.logo} alt={article.source} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-2">{article.title}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{getTimeAgo(article.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {articles.length > 4 && (
              <button 
                onClick={() => setArticlesExpanded(!articlesExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {articlesExpanded ? 'Show Less' : 'Show more articles'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {displayedArticles.map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <img src={article.logo} alt={article.source} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-2">{article.title}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{getTimeAgo(article.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {articles.length > 4 && (
              <button 
                onClick={() => setArticlesExpanded(!articlesExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {articlesExpanded ? 'Show Less' : 'Show more articles'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      {selectedCrypto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={closeChart}>
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10" />
                <div>
                  <h2 className="text-2xl font-bold text-black">{selectedCrypto.name}</h2>
                  <p className="text-gray-600">{selectedCrypto.symbol.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={closeChart} className="p-2 hover:bg-gray-100 rounded-lg">
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
              <button onClick={() => changeChartTimeframe('1')} className={`px-4 py-2 rounded-lg ${chartTimeframe === '1' ? 'bg-[#ffc93c] text-black' : 'bg-gray-100 text-black'}`}>1 Day</button>
              <button onClick={() => changeChartTimeframe('7')} className={`px-4 py-2 rounded-lg ${chartTimeframe === '7' ? 'bg-[#ffc93c] text-black' : 'bg-gray-100 text-black'}`}>1 Week</button>
            </div>

            <div className="h-64 mb-4">
              {chartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="animate-spin text-[#ffc93c]" size={32} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af" 
                      style={{ fontSize: '11px' }} 
                      interval="preserveStartEnd"
                      tickMargin={8}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      style={{ fontSize: '11px' }} 
                      tickFormatter={(value) => `$${value.toFixed(2)}`} 
                      width={70}
                      domain={['auto', 'auto']}
                      scale="linear"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']} 
                    />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">Market Cap</p>
                <p className="font-bold text-black">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">24h High</p>
                <p className="font-bold text-black">${selectedCrypto.high_24h?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">24h Low</p>
                <p className="font-bold text-black">${selectedCrypto.low_24h?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">All-Time High</p>
                <p className="font-bold text-black">${selectedCrypto.ath?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
