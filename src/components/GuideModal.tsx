import React from 'react';
import { X, BookOpen, Zap, BarChart3, Layers, TrendingUp, Target, Sparkles, Activity, ShieldCheck, ChevronRight, Swords } from 'lucide-react';

export type GuideType =
    | 'COMBO_STRATEGIES'
    | 'MA_CROSS'
    | 'VOLUME'
    | 'MULTI_TF_MA'
    | 'EMA_TREND'
    | 'ICHIMOKU'
    | 'DIVERGENCE'
    | 'KEY_LEVELS'
    | 'FIBONACCI'
    | 'ANALYTICS'
    | 'ANOMALY';

interface GuideModalProps {
    type: GuideType;
    onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ type, onClose }) => {
    const renderContent = () => {
        switch (type) {
            case 'COMBO_STRATEGIES':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                <Swords size={18} /> HỆ THỐNG 5 COMBO CHIẾN LƯỢC
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Robot chỉ nổ lệnh khi đủ điều kiện vào 1 trong 5 Combo chiến lược. Mỗi combo là sự kết hợp của nhiều chỉ báo xác nhận lẫn nhau, giúp tăng độ chính xác và giảm nhiễu.
                            </p>
                        </div>

                        {/* Combo 1 */}
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                            <h4 className="text-purple-400 font-black mb-2 flex items-center gap-2">
                                💎 COMBO 1: SÁT THỦ BẮT ĐỈNH ĐÁY
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>Mục đích:</b> Bắt điểm đảo chiều tại đỉnh/đáy với độ chính xác cao.
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">RSI Divergence:</b> Phân kỳ giữa giá và RSI (Bullish/Bearish)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Price Action:</b> PinBar hoặc Engulfing tại vùng Support/Resistance</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Volume Spike:</b> Khối lượng tăng đột biến (&gt;1.8x)</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-purple-500/10 rounded-lg border-l-2 border-purple-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 <b>Chiến thuật:</b> Vào lệnh khi thấy phân kỳ + nến đảo chiều tại vùng cản quan trọng.
                                </p>
                            </div>
                        </div>

                        {/* Combo 2 */}
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                            <h4 className="text-green-400 font-black mb-2 flex items-center gap-2">
                                ⚔️ COMBO 2: CHIẾN THẦN ĐU TREND
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>Mục đích:</b> Đi theo xu hướng mạnh với xác nhận đa chỉ báo.
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-green-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Trend Align:</b> 4H và 1H cùng chiều (Bullish hoặc Bearish)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-green-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Ichimoku Cloud:</b> Giá trên/dưới mây (Cloud Align)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-green-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">EMA Cross:</b> Đường nhanh cắt đường chậm</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-green-500/10 rounded-lg border-l-2 border-green-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 <b>Chiến thuật:</b> Chỉ vào lệnh khi cả 3 yếu tố đồng thuận cùng chiều.
                                </p>
                            </div>
                        </div>

                        {/* Combo 3 */}
                        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl">
                            <h4 className="text-orange-400 font-black mb-2 flex items-center gap-2">
                                🪤 COMBO 3: BẪY GIÁ - SĂN THANH KHOẢN
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>Mục đích:</b> Bắt các đợt fake breakout và liquidity hunt.
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Level Break:</b> Giá phá vùng cản quan trọng</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">PinBar Rejection:</b> Nến PinBar bị từ chối</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Volume Explosion:</b> Khối lượng cực cao (&gt;2.0x)</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-orange-500/10 rounded-lg border-l-2 border-orange-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 <b>Chiến thuật:</b> Vào lệnh ngược chiều khi thấy PinBar rejection + volume cao.
                                </p>
                            </div>
                        </div>

                        {/* Combo 4 */}
                        <div className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl">
                            <h4 className="text-red-400 font-black mb-2 flex items-center gap-2">
                                💣 COMBO 4: QUẢ BOM ĐỘNG LƯỢNG
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>Mục đích:</b> Bắt breakout mạnh với động lượng cao.
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-red-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">EMA Squeeze:</b> Các đường EMA hội tụ sát nhau</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-red-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Marubozu Candle:</b> Nến thân dài, không râu</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-red-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">Volume Explosion:</b> Khối lượng nổ (&gt;3.0x)</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-red-500/10 rounded-lg border-l-2 border-red-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 <b>Chiến thuật:</b> Vào lệnh ngay khi nến Marubozu xuất hiện với volume cực cao.
                                </p>
                            </div>
                        </div>

                        {/* Combo 5 */}
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                            <h4 className="text-blue-400 font-black mb-2 flex items-center gap-2">
                                ⚖️ COMBO 5: ĐỒNG THUẬN ĐA KHUNG
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>Mục đích:</b> Tín hiệu mạnh nhất khi cả 3 khung đồng thuận.
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">4H Trend:</b> Xu hướng khung 4 giờ</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">1H Trend:</b> Xu hướng khung 1 giờ</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5" />
                                    <span className="text-gray-400"><b className="text-white">15m Trend + RSI:</b> Xu hướng 15m và RSI extreme (&lt;35 hoặc &gt;65)</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border-l-2 border-blue-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 <b>Chiến thuật:</b> Chỉ vào lệnh khi cả 3 khung cùng chiều + RSI extreme.
                                </p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                            <p className="text-xs font-bold text-yellow-400 mb-2 uppercase">⚠️ LƯU Ý QUAN TRỌNG</p>
                            <ul className="space-y-1 text-[10px] text-gray-400">
                                <li>• Robot chỉ nổ lệnh khi đủ điều kiện vào 1 trong 5 Combo</li>
                                <li>• Mỗi Combo có nhiều chỉ báo xác nhận lẫn nhau</li>
                                <li>• Số lượng tín hiệu giảm nhưng chất lượng tăng</li>
                                <li>• Kiểm tra phân tích 5 Combo ở bảng "PHÂN TÍCH GIờ VÀNG VÀ CHIẾN LƯỢC"</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'MA_CROSS':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                <Zap size={18} /> CƠ CHẾ HOẠT ĐỘNG
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Robot sử dụng các đường EMA (Exponential Moving Average) để xác định điểm đảo chiều sớm. Có 2 trường phái chính:
                            </p>
                            <ul className="mt-3 space-y-2 text-xs text-gray-400">
                                <li className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-500 mt-0.5" />
                                    <span><b>Scalping (1m):</b> Cặp EMA 5 & 13. Phản ứng cực nhanh với biến động ngắn hạn.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-500 mt-0.5" />
                                    <span><b>An Toàn (15m/1h):</b> Cặp EMA 12 & 26. Giảm nhiễu và bắt sóng trung hạn ổn định.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-[10px] font-bold text-green-400 mb-1 uppercase">BULLISH CROSS</p>
                                <p className="text-xs text-gray-400">Đường nhanh cắt lên đường chậm. Tín hiệu MUA (LONG).</p>
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-[10px] font-bold text-red-400 mb-1 uppercase">BEARISH CROSS</p>
                                <p className="text-xs text-gray-400">Đường nhanh cắt xuống đường chậm. Tín hiệu BÁN (SHORT).</p>
                            </div>
                        </div>
                    </div>
                );
            case 'VOLUME':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                                <BarChart3 size={18} /> VOLUME RATIO (Tỉ lệ khối lượng)
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                So sánh khối lượng giao dịch hiện tại với trung bình 20 cây nến gần nhất.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-500 font-bold text-xs">&gt; 1.5x</div>
                                <div className="text-xs text-gray-300"><b>Đột phá:</b> Dòng tiền lớn đang vào, xác nhận xu hướng mạnh.</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 font-bold text-xs">0.8x - 1.2x</div>
                                <div className="text-xs text-gray-300"><b>Bình ổn:</b> Thị trường đang lưỡng lự hoặc tích lũy.</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-500 font-bold text-xs">&lt; 0.5x</div>
                                <div className="text-xs text-gray-300"><b>Cạn kiệt:</b> Thiếu thanh khoản, dễ xảy ra đảo chiều hoặc "quét" râu nến.</div>
                            </div>
                        </div>
                    </div>
                );
            case 'MULTI_TF_MA':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                                <Layers size={18} /> PHÂN TÍCH ĐA KHUNG (MTF)
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Quy tắc vàng: <b>"Thuận xu hướng lớn, bắt sóng khung nhỏ"</b>. Robot tự động tổng hợp xu hướng từ 4 khung thời gian để đưa ra xác suất thắng (Confidence).
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="p-3 bg-white/5 rounded-lg border-l-4 border-purple-500">
                                <p className="text-xs font-bold text-white uppercase">Overall Bias</p>
                                <p className="text-[10px] text-gray-400 mt-1">Gợi ý hướng đánh dựa trên sự đồng thuận của 1m, 15m, 1h và 4h.</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border-l-4 border-yellow-500">
                                <p className="text-xs font-bold text-white uppercase">Confidence (%)</p>
                                <p className="text-[10px] text-gray-400 mt-1">Độ tin cậy của tín hiệu. Trên 70% được coi là tín hiệu mạnh.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'EMA_TREND':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                                <TrendingUp size={18} /> EMA TREND BIAS
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Sử dụng 3 đường hầm EMA (20, 50, 200) để xác định "vùng định giá" của thị trường.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between p-2 rounded-lg bg-green-500/5">
                                <span className="text-green-500 font-bold">Giá &gt; EMA 200</span>
                                <span className="text-gray-400">Xu hướng TĂNG dài hạn</span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-red-500/5">
                                <span className="text-red-500 font-bold">Giá &lt; EMA 200</span>
                                <span className="text-gray-400">Xu hướng GIẢM dài hạn</span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-yellow-500/5">
                                <span className="text-yellow-500 font-bold">GAP (%)</span>
                                <span className="text-gray-400">Khoảng cách từ giá tới EMA. Gap quá lớn (&gt;2-3%) dễ bị điều chỉnh (Rebound).</span>
                            </div>
                        </div>
                    </div>
                );
            case 'ICHIMOKU':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                <Sparkles size={18} /> MÂY ICHIMOKU
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Hệ thống xác định xu hướng và vùng hỗ trợ/kháng cự động thông qua "Mây" (Kumo Cloud).
                            </p>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-400">
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                                <span><b>Trên Mây:</b> Thị trường cực mạnh, ưu tiên lệnh LONG.</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                                <span><b>Dưới Mây:</b> Thị trường cực yếu, ưu tiên lệnh SHORT.</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5"></div>
                                <span><b>Trong Mây:</b> Vùng tích lũy, không rõ xu hướng. Hạn chế vào lệnh.</span>
                            </li>
                            <li className="flex gap-2 border-t border-white/5 pt-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                                <span><b>Tenkan &gt; Kijun:</b> Tín hiệu tăng giá sớm.</span>
                            </li>
                        </ul>
                    </div>
                );
            case 'DIVERGENCE':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                            <h3 className="text-pink-400 font-bold mb-2 flex items-center gap-2">
                                <Activity size={18} /> PHÂN KỲ RSI
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Hiện tượng giá và RSI đi ngược chiều nhau, báo hiệu một cú đảo chiều mạnh sắp xảy ra.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-xs font-bold text-green-400 uppercase">Bullish Divergence (Hội tụ)</p>
                                <p className="text-[10px] text-gray-400 mt-1">Giá tạo đáy thấp mới nhưng RSI tạo đáy cao hơn. Báo hiệu sức bán cạn kiệt, giá chuẩn bị bay.</p>
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-xs font-bold text-red-400 uppercase">Bearish Divergence (Phân kỳ)</p>
                                <p className="text-[10px] text-gray-400 mt-1">Giá tạo đỉnh cao mới nhưng RSI tạo đỉnh thấp hơn. Báo hiệu sức mua cạn kiệt, giá chuẩn bị sập.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'KEY_LEVELS':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                <Target size={18} /> VÙNG CẢN QUAN TRỌNG (PIVOT)
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Robot tính toán các mức Pivot Point dựa trên biến động của ngày/giờ trước đó để tìm ra các "bến đỗ" của giá.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <span className="block text-red-400 font-bold mb-1">R1/R2/R3</span>
                                <span className="text-[10px] text-gray-400">Kháng cự (Resistance). Nơi phe Bán tập trung.</span>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <span className="block text-green-400 font-bold mb-1">S1/S2/S3</span>
                                <span className="text-[10px] text-gray-400">Hỗ trợ (Support). Nơi phe Mua chờ đợi.</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase">CHIẾN THUẬT QUYẾT ĐỊNH</p>
                            <p className="text-xs text-gray-400 italic">"Chờ giá chạm Cản + Xuất hiện nến đảo chiều (Pinbar/Engulfing) = Vào lệnh."</p>
                        </div>
                    </div>
                );
            case 'FIBONACCI':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-600/10 border border-amber-600/20 rounded-xl">
                            <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2">
                                <Sparkles size={18} /> BỘ TÍNH FIBONACCI
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Công cụ tìm điểm "hồi mã thương". Giá thường quay lại các tỷ lệ Fibonacci vàng để lấy đà trước khi tiếp tục xu hướng.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-[var(--color-golden)]/10 border border-[var(--color-golden)]/20 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[var(--color-golden)] uppercase italic">Golden Zone</p>
                                    <p className="text-[10px] text-gray-400">Mức 0.5 - 0.618</p>
                                </div>
                                <span className="text-[10px] text-gray-400 text-right">Vùng vào lệnh đẹp nhất.</span>
                            </div>
                            <div className="text-xs text-gray-400 p-2 border-l-2 border-white/20 ml-2">
                                <p>• <b>0.236 / 0.382:</b> Điều chỉnh nông, xu hướng rất mạnh.</p>
                                <p className="mt-1">• <b>0.786:</b> Điều chỉnh sâu, ranh giới cuối cùng của xu hướng.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'ANALYTICS':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                            <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                                <BarChart3 size={18} /> TRADING ANALYTICS
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Nhật ký và dữ liệu thống kê hiệu suất thực tế của Robot để tối ưu hóa lợi nhuận.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2 border border-white/5 rounded-lg">
                                <p className="text-white/40 uppercase font-bold mb-1">Win Rate</p>
                                <p className="text-gray-300">Tỉ lệ lệnh chiến thắng trong tổng số lệnh Robot đã chốt.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'ANOMALY':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                            <h3 className="text-pink-400 font-bold mb-2 flex items-center gap-2">
                                <Activity size={18} /> BOT THEO DÕI BIẾN ĐỘNG
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Hệ thống phát hiện sớm các cú "Bơm/Xả" (Pump/Dump) bất thường dựa trên chênh lệch giá % và biến động tương đối (ATR).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase">GIẢI THÍCH CHỈ SỐ</p>
                                <ul className="space-y-2 text-[11px] text-gray-400">
                                    <li className="flex gap-2">
                                        <b className="text-white min-w-[60px]">Mẫu (N):</b>
                                        <span>Số lượng biến động được ghi nhận trong hệ thống.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <b className="text-white min-w-[60px]">Tỉ lệ hồi:</b>
                                        <span>Xác suất giá quay về điểm bắt đầu sau khi đột biến (Mean Reversion).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <b className="text-white min-w-[60px]">Trung bình hồi:</b>
                                        <span>Thời gian trung bình (phút) để giá phục hồi hoàn toàn. Số càng nhỏ nghĩa là giá hồi càng nhanh.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-yellow-500 mb-2 uppercase">CÁC TRẠNG THÁI</p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-black rounded uppercase">TRACKING</div>
                                        <p className="text-[10px] text-gray-400"><b>Đang theo dõi:</b> Bot vừa phát hiện giá sập/bơm và đang chờ xem giá có hồi lại hay không.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-black rounded uppercase">RECOVERED</div>
                                        <p className="text-[10px] text-gray-400"><b>Đã hồi phục:</b> Giá đã quay lại mức giá trước khi xảy ra biến động.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-[9px] font-black rounded uppercase">KHÔNG HỒI PHỤC</div>
                                        <p className="text-[10px] text-gray-400"><b>Không hồi:</b> Giá không quay lại điểm cũ sau một thời gian theo dõi quy định.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-cyan-400 mb-2 uppercase">THỜI GIAN THEO DÕI</p>
                                <ul className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                                    <li>• Khung 1m: <b>1 giờ</b></li>
                                    <li>• Khung 15m: <b>4 giờ</b></li>
                                    <li>• Khung 1h: <b>24 giờ</b></li>
                                    <li>• Khung 4h: <b>48 giờ</b></li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase">CƠ CHẾ KÍCH HOẠT</p>
                            <p className="text-[10px] text-gray-400 italic">"Bot quét từng giây, phát hiện nến dài gấp 3 lần bình thường (ATR) hoặc vọt ngưỡng % cố định để báo động."</p>
                        </div>
                    </div>
                );
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'MA_CROSS': return 'Chiến lược MA Cross';
            case 'VOLUME': return 'Phân tích Khối lượng';
            case 'MULTI_TF_MA': return 'Phân tích Đa khung';
            case 'EMA_TREND': return 'Xu hướng EMA';
            case 'ICHIMOKU': return 'Mây Ichimoku';
            case 'DIVERGENCE': return 'Phân tích Phân Kỳ';
            case 'KEY_LEVELS': return 'Vùng Cản Quan Trọng';
            case 'FIBONACCI': return 'Bộ tính Fibonacci';
            case 'ANALYTICS': return 'Trading Analytics';
            case 'ANOMALY': return 'Bot Theo Dõi Biến Động';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gradient-to-r from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-golden)] text-black rounded-lg">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h2 className="font-black uppercase text-sm tracking-tight">{getTitle()}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hướng dẫn đọc hiểu</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {renderContent()}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase italic">
                        <ShieldCheck size={14} className="text-green-500" />
                        Kiến thức Trading Pro
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[var(--color-bg-tertiary)] hover:bg-white/10 text-white rounded-xl font-bold transition-all text-xs"
                    >
                        ĐÃ HIỂU
                    </button>
                </div>
            </div>
        </div>
    );
};
