import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  UploadCloud, AlertCircle, TrendingUp, DollarSign, CreditCard, 
  Moon, Sun, ArrowLeft, Activity, Filter, FileSpreadsheet, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Paleta de Cores Premium para os Gráficos
const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
const MONTHS_ORDER = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function App() {
  const [screen, setScreen] = useState('upload'); // 'upload' | 'dashboard'
  
  // Deteta o tema inicial ou usa dark por padrão para manter o estilo Admin
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Sincroniza o botão de tema com a classe html
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // ---------------------------------------------------------
  // LÓGICA DE UPLOAD E LEITURA
  // ---------------------------------------------------------
  const onDrop = useCallback((acceptedFiles) => {
    setError('');
    const file = acceptedFiles[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => processData(results.data),
        error: () => setError('Erro ao ler o arquivo CSV.')
      });
    } else if (fileExt === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet);
          processData(data);
        } catch (err) {
          setError('Erro ao ler o arquivo Excel.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setError('Formato inválido. Por favor, envie um arquivo .csv ou .xlsx');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const processData = (data) => {
    const requiredCols = ["Data", "Tipo", "Categoria", "Subcategoria", "Valor", "Status"];
    const fileCols = Object.keys(data[0] || {});
    const missing = requiredCols.filter(col => !fileCols.includes(col));

    if (missing.length > 0) {
      setError(`Arquivo inválido. Faltam as colunas: ${missing.join(', ')}`);
      return;
    }

    const formattedData = data.map(row => {
      let mesName = 'Desconhecido';
      let mesNum = 99;
      
      if (row.Data) {
        // Parser manual para DD/MM/YYYY
        const parts = row.Data.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          const dateObj = new Date(year, month - 1, day);
          
          if (!isNaN(dateObj)) {
            mesName = MONTHS_ORDER[month - 1];
            mesNum = month;
          }
        }
      }
      
      return {
        ...row,
        Valor: Number(row.Valor) || 0,
        Mes: mesName,
        MesNum: mesNum
      };
    }).filter(d => d.Mes !== 'Desconhecido');

    setRawData(formattedData);
    setIsPreviewing(true);
  };

  // ---------------------------------------------------------
  // PROCESSAMENTO DE DADOS PARA O DASHBOARD
  // ---------------------------------------------------------
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      const matchMonth = selectedMonth === 'Todos' || row.Mes === selectedMonth;
      const matchStatus = selectedStatus === 'Todos' || row.Status === selectedStatus;
      return matchMonth && matchStatus;
    });
  }, [rawData, selectedMonth, selectedStatus]);

  const months = useMemo(() => {
    const uniqueMonths = [...new Set(rawData.map(d => d.Mes))];
    return ['Todos', ...uniqueMonths.sort((a, b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b))];
  }, [rawData]);

  const statuses = useMemo(() => ['Todos', ...new Set(rawData.map(d => d.Status))], [rawData]);

  const kpis = useMemo(() => {
    let fluxoCaixa = 0; let receitaPendente = 0; let despesasPagas = 0; let receitaTotal = 0;
    filteredData.forEach(row => {
      if (row.Tipo === 'Receita') {
        if (row.Status !== 'Cancelada') receitaTotal += row.Valor;
        if (row.Status === 'Paga') fluxoCaixa += row.Valor;
        if (row.Status === 'Pendente') receitaPendente += row.Valor;
      } else if (row.Tipo === 'Despesa' && row.Status === 'Paga') {
        despesasPagas += Math.abs(row.Valor);
      }
    });
    return { fluxoCaixa, receitaPendente, despesasPagas, receitaTotal };
  }, [filteredData]);

  const pieChartData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      if (row.Tipo === 'Receita') acc[row.Subcategoria] = (acc[row.Subcategoria] || 0) + row.Valor;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [filteredData]);

  const paymentChartData = useMemo(() => {
    if (selectedStatus !== 'Pendente') return [];
    const pendingRevenues = filteredData.filter(row => row.Tipo === 'Receita' && row.Status === 'Pendente');
    const grouped = pendingRevenues.reduce((acc, row) => {
      acc[row['Forma de Pagamento']] = (acc[row['Forma de Pagamento']] || 0) + row.Valor;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
  }, [filteredData, selectedStatus]);

  const barChartData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      if (!acc[row.Categoria]) acc[row.Categoria] = { name: row.Categoria, Receita: 0, Despesa: 0 };
      if (row.Tipo === 'Receita') acc[row.Categoria].Receita += row.Valor;
      if (row.Tipo === 'Despesa') acc[row.Categoria].Despesa += row.Valor;
      return acc;
    }, {});
    return Object.values(grouped).sort((a,b) => (b.Receita + b.Despesa) - (a.Receita + a.Despesa)).slice(0, 8);
  }, [filteredData]);

  const lineChartData = useMemo(() => {
    const grouped = rawData.reduce((acc, row) => {
      if (!acc[row.Mes]) {
        acc[row.Mes] = { name: row.Mes, Real: 0, Projetado: 0, mesNum: row.MesNum };
      }
      // No CSV despesas são negativas, somar diretamente para obter o saldo líquido
      if (row.Status === 'Paga') acc[row.Mes].Real += row.Valor;
      
      // Projetado: Pago (Receita/Despesa) + Pendente (apenas Receita conforme Python)
      if (row.Status === 'Paga' || (row.Tipo === 'Receita' && row.Status === 'Pendente')) {
        acc[row.Mes].Projetado += row.Valor;
      }
      
      return acc;
    }, {});

    return Object.values(grouped)
      .map(d => ({ ...d, Impacto: d.Projetado - d.Real }))
      .sort((a, b) => a.mesNum - b.mesNum);
  }, [rawData]);

  // ---------------------------------------------------------
  // TELA DE UPLOAD (DESIGN PREMIUM)
  // ---------------------------------------------------------
  if (screen === 'upload') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
        
        {/* Glow de Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-xl w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] shadow-2xl p-10 border border-white/50 dark:border-slate-800/50 relative z-10"
        >
          <div className="text-center mb-10">
            <div className="bg-indigo-600 text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
              <Activity size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financial Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {isPreviewing ? "Confirme os dados extraídos abaixo." : "Faça upload do seu relatório financeiro para gerar inteligência de dados."}
            </p>
          </div>

          {!isPreviewing ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-300 group
                ${isDragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <input {...getInputProps()} />
              <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">
                {isDragActive ? "Solte o arquivo agora!" : "Arraste seu .CSV ou .XLSX"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest">
                Ou clique para procurar no computador
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-tighter">
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">Data</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">Categoria</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">Subcategoria</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-300">
                    {rawData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 border-b border-slate-100 dark:border-slate-800/50">{row.Data}</td>
                        <td className="p-3 border-b border-slate-100 dark:border-slate-800/50">{row.Categoria}</td>
                        <td className="p-3 border-b border-slate-100 dark:border-slate-800/50 truncate max-w-[100px]">{row.Subcategoria}</td>
                        <td className="p-3 border-b border-slate-100 dark:border-slate-800/50 text-right font-bold">{formatCurrency(row.Valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsPreviewing(false)} 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => setScreen('dashboard')} 
                  className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Confirmar e Avançar
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-center text-red-600 dark:text-red-400 gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // TELA DE DASHBOARD (ADMIN CRM STYLE)
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 lg:p-8 transition-colors duration-500 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER & FILTROS */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => { setScreen('upload'); setIsPreviewing(false); }} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors active:scale-95">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                 Financial Analytics
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Visão Estratégica</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full lg:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-8 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-colors"
                value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map(m => <option key={m} value={m}>{m === 'Todos' ? 'Mês: Todos' : m}</option>)}
              </select>
            </div>

            <div className="flex-1 lg:flex-none relative">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full lg:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-8 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-colors"
                value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Status: Todos' : s}</option>)}
              </select>
            </div>

            <button onClick={toggleTheme} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
              {theme === 'light' ? <Moon size={20} className="text-indigo-600" /> : <Sun size={20} className="text-amber-400" />}
            </button>
          </div>
        </header>

        {/* 1. KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <KpiCard 
            title="Fluxo de Caixa (Receita Paga)" 
            value={kpis.fluxoCaixa} 
            icon={TrendingUp} 
            color="text-emerald-500" 
            bg="bg-emerald-500/10" 
            border="border-emerald-500/20"
            delta={kpis.receitaTotal > 0 ? (kpis.fluxoCaixa / kpis.receitaTotal - 1) : 0}
          />
          <KpiCard title="Receita Pendente" value={kpis.receitaPendente} icon={AlertCircle} color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/20" />
          <KpiCard title="Despesas Pagas" value={kpis.despesasPagas} icon={CreditCard} color="text-rose-500" bg="bg-rose-500/10" border="border-rose-500/20" />
        </div>

        {/* 2. GRÁFICOS (LINHA 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfico de Barras (Ocupa 2 Colunas) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl dark:shadow-none">
             <div className="mb-6">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comparativo</h3>
               <p className="text-xl font-black mt-1">Receita vs Despesa por Categoria</p>
             </div>
             <div className="h-64 lg:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                  <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} width={80} />
                  <Tooltip 
                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} 
                    formatter={(value) => [formatCurrency(value), ""]} 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Bar name="Receita" dataKey="Receita" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={20} />
                  <Bar name="Despesa" dataKey="Despesa" fill="#f43f5e" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl dark:shadow-none flex flex-col">
            <div className="mb-6">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 {selectedStatus === 'Pendente' ? 'Pendências' : 'Distribuição'}
               </h3>
               <p className="text-xl font-black mt-1">
                 {selectedStatus === 'Pendente' ? 'Por Forma de Pagamento' : 'Top Receitas'}
               </p>
             </div>
             <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                {selectedStatus === 'Pendente' ? (
                  <BarChart data={paymentChartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                ) : (
                  <RechartsPieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }} />
                  </RechartsPieChart>
                )}
              </ResponsiveContainer>
              {selectedStatus !== 'Pendente' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <PieChart size={32} className="text-slate-300 dark:text-slate-700" />
                </div>
              )}
            </div>
            
            {/* Legenda Customizada (Só para Pie Chart) */}
            {selectedStatus !== 'Pendente' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. GRÁFICO DE LINHA (LINHA 2) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl dark:shadow-none">
            <div className="mb-8">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Previsão</h3>
               <p className="text-xl font-black mt-1">Fluxo Real vs Projetado</p>
             </div>
             <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                      formatter={(value) => [formatCurrency(value), ""]}
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Line name="Saldo Realizado" type="monotone" dataKey="Real" stroke="#4f46e5" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                  <Line name="Projetado" type="monotone" dataKey="Projetado" stroke="#10b981" strokeWidth={3} strokeDasharray="6 6" dot={false} />
                  <Line name="Impacto Pendência" type="monotone" dataKey="Impacto" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
             </div>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENTE: KPI CARD PREMIUM
// ---------------------------------------------------------
function KpiCard({ title, value, icon: Icon, color, bg, border, delta }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border-t-4 border-slate-100 dark:border-slate-800 ${border} p-6 rounded-[2rem] shadow-lg dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
      <div className={`absolute -inset-4 ${bg} opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-500`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${bg} ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</h4>
        <p className={`text-2xl lg:text-3xl font-black tracking-tight ${color}`}>{formatCurrency(value)}</p>
        {delta !== undefined && (
          <p className={`text-[10px] font-bold mt-1 ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {delta >= 0 ? '↑' : '↓'} {(Math.abs(delta) * 100).toFixed(1)}% vs Total Previsto
          </p>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 0 }).format(value || 0);
}