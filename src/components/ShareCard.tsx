import React from 'react';

interface ShareCardProps {
    symbol: string;
    winRate: number;
    wins: number;
    losses: number;
    total: number;
    tfBreakdown?: Record<string, { total: number, wins: number, losses: number }>;
    timeFilter: '24h' | '7d' | '30d' | 'all';
}

export const ShareCard: React.FC<ShareCardProps> = ({
    symbol,
    winRate,
    wins,
    losses,
    total,
    tfBreakdown,
    timeFilter
}) => {
    const coinName = symbol.replace('USDT', '');
    const filterText = timeFilter === 'all' ? 'Tất Cả' : timeFilter === '24h' ? '24 Giờ' : timeFilter === '7d' ? '7 Ngày' : '30 Ngày';
    const now = new Date();
    const timestamp = now.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div
            id={`share-card-${symbol}`}
            style={{
                width: '600px',
                height: '800px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                borderRadius: '20px',
                padding: '40px',
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                position: 'absolute',
                left: '-9999px',
                top: '0',
                boxSizing: 'border-box'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#fbbf24'
                }}>
                    Anh Duc Trading
                </div>
                <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)'
                }}>
                    {filterText}
                </div>
            </div>

            {/* Coin Symbol */}
            <div style={{
                textAlign: 'center',
                marginBottom: '30px'
            }}>
                <div style={{
                    fontSize: '80px',
                    fontWeight: '900',
                    letterSpacing: '-2px',
                    textShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
                }}>
                    {coinName}
                </div>
                <div style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '10px'
                }}>
                    USDT Perpetual
                </div>
            </div>

            {/* Win Rate */}
            <div style={{
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                <div style={{
                    fontSize: '72px',
                    fontWeight: '900',
                    color: winRate >= 50 ? '#10b981' : '#ef4444',
                    textShadow: `0 4px 30px ${winRate >= 50 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                }}>
                    {winRate.toFixed(1)}%
                </div>
                <div style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: '600',
                    marginTop: '10px'
                }}>
                    Win Rate
                </div>
            </div>

            {/* Win/Loss Boxes */}
            <div style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <div style={{
                    flex: 1,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#10b981',
                        fontWeight: '600',
                        marginBottom: '8px'
                    }}>
                        Thắng
                    </div>
                    <div style={{
                        fontSize: '36px',
                        fontWeight: '900',
                        color: '#10b981'
                    }}>
                        {wins}
                    </div>
                </div>
                <div style={{
                    flex: 1,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#ef4444',
                        fontWeight: '600',
                        marginBottom: '8px'
                    }}>
                        Thua
                    </div>
                    <div style={{
                        fontSize: '36px',
                        fontWeight: '900',
                        color: '#ef4444'
                    }}>
                        {losses}
                    </div>
                </div>
            </div>

            {/* Timeframe Breakdown */}
            {tfBreakdown && Object.keys(tfBreakdown).length > 0 && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        color: '#fbbf24'
                    }}>
                        Phân tích theo khung:
                    </div>
                    {Object.entries(tfBreakdown)
                        .filter(([_, data]) => data.total > 0)
                        .map(([tf, data]) => {
                            const rate = data.total > 0 ? (data.wins / data.total * 100) : 0;
                            return (
                                <div key={tf} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                    fontSize: '14px'
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        {tf}:
                                    </span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: rate >= 50 ? '#10b981' : '#ef4444'
                                    }}>
                                        {rate.toFixed(0)}% ({data.wins}/{data.losses})
                                    </span>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Footer */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '40px',
                right: '40px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '8px'
                }}>
                    Tổng số tín hiệu: {total}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)'
                }}>
                    {timestamp}
                </div>
            </div>
        </div>
    );
};
