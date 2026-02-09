
import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function DashboardCharts() {
    // Estado para ventas diarias
    const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState<number[]>([]);
    const [dailyLoading, setDailyLoading] = useState(false);

    // Estado para ventas por rango
    const [rangeStart, setRangeStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [rangeEnd, setRangeEnd] = useState(new Date().toISOString().split('T')[0]);
    const [rangeLabels, setRangeLabels] = useState<string[]>([]);
    const [rangeValues, setRangeValues] = useState<number[]>([]);
    const [rangeLoading, setRangeLoading] = useState(false);

    // Fetch Daily Data
    useEffect(() => {
        async function fetchDaily() {
            setDailyLoading(true);
            try {
                const res = await fetch(`/api/admin/stats/daily-sales?date=${dailyDate}`);
                if (!res.ok) throw new Error('Error fetching daily data');
                const data = await res.json();
                setDailyData(data.sales || []);
            } catch (err) {
                console.error(err);
            } finally {
                setDailyLoading(false);
            }
        }
        fetchDaily();
    }, [dailyDate]);

    // Fetch Range Data
    useEffect(() => {
        async function fetchRange() {
            setRangeLoading(true);
            try {
                const res = await fetch(`/api/admin/stats/range-sales?startDate=${rangeStart}&endDate=${rangeEnd}`);
                if (!res.ok) throw new Error('Error fetching range data');
                const data = await res.json();
                setRangeLabels(data.labels || []);
                setRangeValues(data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setRangeLoading(false);
            }
        }
        if (rangeStart && rangeEnd) {
            fetchRange();
        }
    }, [rangeStart, rangeEnd]);

    // Configuración de Gráfica Diaria
    const barData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
            {
                label: 'Ventas (€)',
                data: dailyData,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1,
            },
        ],
    };

    const barOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: `Ventas del día (${dailyDate})` },
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    // Configuración de Gráfica de Rango
    const lineData = {
        labels: rangeLabels,
        datasets: [
            {
                label: 'Ventas Totales (€)',
                data: rangeValues,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const lineOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: 'Tendencia de Ventas' },
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>

            {/* Chart 1: Daily */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Ventas por Hora</h3>
                    <input
                        type="date"
                        value={dailyDate}
                        onChange={(e) => setDailyDate(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {dailyLoading ? (
                        <p>Cargando...</p>
                    ) : (
                        <Bar data={barData} options={barOptions} />
                    )}
                </div>
            </div>

            {/* Chart 2: Range */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Historial de Ventas</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="date"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                        <span style={{ alignSelf: 'center' }}>a</span>
                        <input
                            type="date"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                </div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rangeLoading ? (
                        <p>Cargando...</p>
                    ) : (
                        <Line data={lineData} options={lineOptions} />
                    )}
                </div>
            </div>

        </div>
    );
}
