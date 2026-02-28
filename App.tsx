
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
// Always use import {GoogleGenAI} from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { database, CATEGORIES, discoveryItems } from './data';
import chinaMapData from './china-map.json';

// --- 子组件 ---

const Header: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleString('zh-CN', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleString('zh-CN', { hour12: false })), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-20 w-full flex items-center justify-between px-10 mb-4 overflow-hidden bg-black/40 border-b border-[#c5a059]/20 backdrop-blur-sm">
      <div className="flex-1 flex items-center gap-4">
        <div className="w-10 h-10 border border-[#c5a059] flex items-center justify-center rotate-45">
          <div className="rotate-[-45deg] text-[#c5a059] font-bold">非</div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Intangible Heritage</span>
          <span className="text-xs text-green-500 font-bold tracking-tighter">DATA VISUALIZATION</span>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full flex flex-col items-center justify-center pointer-events-none text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] md:tracking-[0.5em] text-white drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]">
          中国非物质文化遗产数字化大屏
        </h1>
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mt-2"></div>
      </div>

      <div className="flex-1 flex justify-end">
        <div className="text-[#c5a059] font-mono digital-font text-xl md:text-2xl opacity-90">
          {time}
        </div>
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`glass-panel p-4 flex flex-col min-h-0 ${className}`}>
    <div className="trad-corner tc-tl"></div>
    <div className="trad-corner tc-tr"></div>
    <div className="trad-corner tc-bl"></div>
    <div className="trad-corner tc-br"></div>
    <div className="panel-header mb-2 flex items-center gap-2 flex-shrink-0">
      <div className="w-1.5 h-4 bg-[#8e1c1c]"></div>
      {title}
    </div>
    <div className="flex-1 w-full min-h-0 relative">
      {children}
    </div>
  </div>
);

// --- 主程序 ---

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [aiInsight, setAiInsight] = useState("正在生成 AI 数字化洞察...");
  
  const mapRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  
  const charts = useRef<{ [key: string]: echarts.ECharts | null }>({});
  const currentData = useMemo(() => database[activeCategory], [activeCategory]);

  const handleDiscoveryClick = (loc: string) => {
    const chart = charts.current.map;
    if (chart) {
      chart.dispatchAction({ type: 'highlight', name: loc });
      chart.dispatchAction({ type: 'showTip', name: loc });
    }
  };

  // Fetch AI Insight using Gemini API
  useEffect(() => {
    const fetchAiInsight = async () => {
      setAiInsight("正在生成 AI 数字化洞察...");
      try {
        // 检查API_KEY是否存在
        if (!process.env.API_KEY) {
          setAiInsight("AI 洞察功能需要配置 API Key");
          return;
        }
        // Use this process.env.API_KEY string directly when initializing the @google/genai client instance
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `作为非物质文化遗产数字化专家，请针对“${activeCategory}”这一门类，提供一个关于其在数字时代保护或创新的专业短评（50字以内）。`,
        });
        // The GenerateContentResponse object features a text property (not a method)
        setAiInsight(response.text || "暂无 AI 洞察");
      } catch (err) {
        console.error("AI Insight fetch failed:", err);
        setAiInsight("AI 洞察获取失败，请检查网络连接。");
      }
    };
    fetchAiInsight();
  }, [activeCategory]);

  useEffect(() => {
    const initCharts = async () => {
      // 1. 地图
      if (!charts.current.map && mapRef.current) {
        charts.current.map = echarts.init(mapRef.current);
        try {
          echarts.registerMap('china', chinaMapData);
        } catch (e) { console.error("地图数据加载失败", e); }
      }
      updateMap();

      // 2. 饼图
      if (!charts.current.pie && pieRef.current) {
        charts.current.pie = echarts.init(pieRef.current);
      }
      updatePie();

      // 3. 柱状图
      if (!charts.current.bar && barRef.current) {
        charts.current.bar = echarts.init(barRef.current);
      }
      updateBar();

      // 4. 雷达图
      if (!charts.current.radar && radarRef.current) {
        charts.current.radar = echarts.init(radarRef.current);
      }
      updateRadar();
    };

    const timer = requestAnimationFrame(initCharts);
    
    // Fix: Cast 'c' to 'echarts.ECharts | null' to resolve the 'unknown' type error on line 114
    const handleResize = () => Object.values(charts.current).forEach((c) => (c as echarts.ECharts | null)?.resize());
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeCategory, currentData]);

  const updateMap = () => {
    const chart = charts.current.map;
    if (!chart) return;
    const values = currentData.provinceData.map((d: any) => d.value);
    const max = Math.max(...values, 10);

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
        borderColor: '#c5a059',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        formatter: (params: any) => `${params.name}<br/>${activeCategory}: ${params.value || 0}`
      },
      visualMap: {
        min: 0, max: max,
        left: 20, bottom: 20,
        calculable: true,
        inRange: { color: ['#1a1a2e', '#8e1c1c', '#c5a059'] },
        textStyle: { color: '#888' }
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.1,
        itemStyle: { areaColor: '#0a0a0f', borderColor: 'rgba(197,160,89,0.3)' },
        emphasis: { itemStyle: { areaColor: '#ff4d4f' }, label: { show: true, color: '#fff' } }
      },
      series: [{ type: 'map', geoIndex: 0, data: currentData.provinceData }]
    }, true);
  };

  const updatePie = () => {
    const chart = charts.current.pie;
    if (!chart) return;
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 4, borderColor: '#0a0a0f', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, formatter: '{b}\n{d}%', color: '#c5a059' } },
        data: currentData.categoryDistribution,
        color: ['#8e1c1c', '#c5a059', '#1e3a8a', '#065f46', '#7c2d12', '#4c1d95']
      }]
    }, true);
  };

  const updateBar = () => {
    const chart = charts.current.bar;
    if (!chart) return;
    const sorted = [...currentData.provinceData].sort((a, b) => b.value - a.value).slice(0, 8);
    chart.setOption({
      grid: { top: 10, bottom: 10, left: 70, right: 30 },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { show: false }, axisLabel: { show: false } },
      yAxis: { 
        type: 'category', 
        data: sorted.map(d => d.name).reverse(),
        axisLine: { show: false },
        axisLabel: { color: '#999', fontSize: 10 }
      },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.value).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#c5a059' }, { offset: 1, color: '#8e1c1c' }]),
          borderRadius: 2
        },
        label: { show: true, position: 'right', color: '#c5a059', fontSize: 9 }
      }]
    }, true);
  };

  const updateRadar = () => {
    const chart = charts.current.radar;
    if (!chart) return;
    chart.setOption({
      radar: {
        indicator: [
          { name: '保护力度', max: 100 }, { name: '流行度', max: 100 }, { name: '价值', max: 100 },
          { name: '数字化', max: 100 }, { name: '规模', max: 100 }
        ],
        radius: '60%',
        splitNumber: 3,
        axisName: { color: '#c5a059', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(197, 160, 89, 0.1)' } },
        splitArea: { show: false }
      },
      series: [{
        type: 'radar',
        data: [{ value: currentData.radarData, areaStyle: { color: 'rgba(142, 28, 28, 0.3)' }, lineStyle: { color: '#c5a059' } }]
      }]
    }, true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0f] text-gray-200 overflow-hidden font-serif selection:bg-red-900">
      <Header />
      
      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-5 px-6 pb-6 min-h-0">
        
        {/* 左侧 */}
        <div className="col-span-3 row-span-6 flex flex-col gap-5 min-h-0">
          <Panel title="非遗门类检索" className="h-[40%]">
            <div className="grid grid-cols-2 gap-2 p-1 overflow-y-auto h-full scrollbar-thin">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`py-3 px-1 text-xs rounded transition-all border ${
                    activeCategory === cat ? 'bg-red-900/40 border-[#c5a059] text-white' : 'bg-white/5 border-transparent text-gray-500 hover:border-[#c5a059]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="门类核心评估" className="flex-1">
            <div ref={radarRef} className="w-full h-full" />
          </Panel>
          <div className="glass-panel p-5 border-l-4 border-l-[#c5a059] flex-shrink-0">
            <span className="text-[10px] text-gray-500 uppercase">Total Projects</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white digital-font">{currentData.total}</span>
              <span className="text-xs text-[#c5a059]">项</span>
            </div>
          </div>
        </div>

        {/* 中间 */}
        <div className="col-span-6 row-span-6 flex flex-col gap-5 min-h-0">
          <div className="flex-1 glass-panel relative overflow-hidden">
            <div className="trad-corner tc-tl"></div><div className="trad-corner tc-tr"></div>
            <div className="trad-corner tc-bl"></div><div className="trad-corner tc-br"></div>
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
              <h3 className="text-[#c5a059] text-xl font-bold tracking-widest">{activeCategory} · 全国数字化分布</h3>
            </div>
            <div ref={mapRef} className="w-full h-full map-glow cursor-crosshair" />
          </div>
          <div className="h-28 flex gap-5 flex-shrink-0">
             <div className="flex-1 glass-panel p-4 flex items-center justify-between overflow-hidden relative">
                <div className="flex flex-col w-full z-10">
                  <span className="text-[10px] text-[#c5a059] uppercase mb-1 font-bold">AI 数字化解读</span>
                  <div className="text-[11px] text-gray-400 leading-relaxed italic line-clamp-2 pr-4">
                    “{aiInsight}”
                  </div>
                </div>
                <div className="absolute right-4 text-2xl opacity-10 select-none">✦</div>
             </div>
             <div className="flex-1 glass-panel p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase">年度受众</span>
                  <span className="text-2xl font-bold text-white digital-font">2.4亿</span>
                </div>
                <div className="w-10 h-10 bg-[#c5a059]/10 rounded-full flex items-center justify-center text-[#c5a059]">👥</div>
             </div>
          </div>
        </div>

        {/* 右侧 */}
        <div className="col-span-3 row-span-6 flex flex-col gap-5 min-h-0">
          <Panel title="地域分布排行" className="h-[28%]">
            <div ref={barRef} className="w-full h-full" />
          </Panel>
          <Panel title="二级门类构成" className="h-[28%]">
            <div ref={pieRef} className="w-full h-full" />
          </Panel>
          <Panel title="非遗发现之旅" className="flex-1 overflow-hidden">
             <div className="h-full overflow-y-auto pr-2 scrollbar-thin text-[11px]">
                {discoveryItems.map((item, idx) => (
                  <div key={idx} onClick={() => handleDiscoveryClick(item.loc)} className="cursor-pointer border-b border-white/5 py-2 hover:bg-[#c5a059]/5 px-1">
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span>{item.name}</span>
                      <span className="text-[9px] opacity-40">{item.loc}</span>
                    </div>
                    <div className="text-gray-500 line-clamp-1">{item.desc}</div>
                  </div>
                ))}
             </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};

export default App;
