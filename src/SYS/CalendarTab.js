import React, { useState, useEffect, useRef, useMemo } from "react";
import "../CSS/style/CalendarTab.css";

function CalendarTab({ rooms = [], bookings = [], airbookings = [], unavailablePeriods = [], onExportIcal }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });

    const scrollRef = useRef(null);    // 가로 스크롤(달력)
    const wrapperRef = useRef(null);   // 세로 스크롤 주체
    const headerRef  = useRef(null);   // ✅ 날짜 헤더
    const bodyRef    = useRef(null);
    const hasScrolledToToday = useRef(false);
    const getFooterEl = () =>
        document.querySelector("#site-footer, .site-footer, footer")

    /** ----- 상수: 셀/행/헤더 높이 ----- */
    const CELL_WIDTH = 80;

    /** ----- 날짜 리스트 ----- */
    const toLocalYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const dateList = useMemo(() => {
        const dates = [];
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear() + 2, 11, 31);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    }, []);

    /** ----- today로 가로 스크롤 ----- */
    const scrollToDate = (targetDate) => {
        const index = dateList.findIndex((d) => toLocalYMD(d) === toLocalYMD(targetDate));
        const el = scrollRef.current;
        if (!el || index < 0) return;

        let targetLeft = index * CELL_WIDTH - el.clientWidth / 2 + CELL_WIDTH / 2;
        const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        if (targetLeft < 0) targetLeft = 0;
        if (targetLeft > maxLeft) targetLeft = maxLeft;

        el.scrollTo({ left: targetLeft, behavior: "smooth" });
    };

    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
        setTimeout(() => scrollToDate(today), 0);
    };
    const handleYearChange = (e) => {
        const newYear = Number(e.target.value);
        setYear(newYear);
        setTimeout(() => scrollToDate(new Date(newYear, month, 1)), 50);
    };
    const handleMonthChange = (e) => {
        const newMonth = Number(e.target.value);
        setMonth(newMonth);
        setTimeout(() => scrollToDate(new Date(year, newMonth, 1)), 50);
    };

    const formatHeader = (date) => {
        const day = date.getDate();
        const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
        const isToday = toLocalYMD(date) === toLocalYMD(today);
        return <span style={{ fontWeight: isToday ? "bold" : "normal" }}>{day}일 {weekday}</span>;
    };

    const getBookingSpanInDates = (start, end) => {
        const s = new Date(start);
        s.setDate(s.getDate() - 1); // check-in 하루 전부터
        const e = new Date(end);
        return Math.max((e - s) / (1000 * 60 * 60 * 24), 1);
    };

    const showTooltip = (e, content) => {
        // 클릭/탭한 정확한 위치 사용
        const x = e.clientX;
        const y = e.clientY;
        
        setTooltip({
            show: true,
            x: x,
            y: y - 15, // 클릭 위치에서 약간 위로
            content: content
        });
    };

    const hideTooltip = () => {
        setTooltip({ show: false, x: 0, y: 0, content: null });
    };

    // 화면 날짜에서 -1일 해서 원본 날짜 계산
    const getOriginalDates = (booking, isExternal = false) => {
        const checkInDate = new Date(booking.check_in);
        const checkOutDate = new Date(booking.check_out);
        
        // 체크아웃에서 1일 빼기 (화면용 +1일을 되돌림)
        checkOutDate.setDate(checkOutDate.getDate() - 1);
        
        // 외부 예약은 체크인에서도 1일 빼기
        if (isExternal) {
            checkInDate.setDate(checkInDate.getDate() - 1);
        }
        
        return {
            checkIn: isExternal ? checkInDate.toISOString().split('T')[0] : booking.check_in,
            checkOut: checkOutDate.toISOString().split('T')[0]
        };
    };

    /** ----- 초기 today로 가로 스크롤 (1회) ----- */
    useEffect(() => {
        if (hasScrolledToToday.current) return;
        const el = scrollRef.current;
        if (!el || dateList.length === 0) return;

        const run = () => {
            if (el.scrollWidth <= el.clientWidth) {
                requestAnimationFrame(run);
                return;
            }
            scrollToDate(today);
            hasScrolledToToday.current = true;
        };
        requestAnimationFrame(run);
    }, [dateList.length]);

    /** ----- 가로 스크롤 ↔ 월 동기화 ----- */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let timeout;
        const onScroll = () => {
            const idx = Math.floor(el.scrollLeft / CELL_WIDTH);
            const nd = dateList[idx];
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (!nd) return;
                const ny = nd.getFullYear();
                const nm = nd.getMonth();
                const day = nd.getDate();
                if (day >= 1 && (ny !== year || nm !== month)) {
                    setYear(ny);
                    setMonth(nm);
                }
            }, 100);
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [dateList, year, month]);

    /** ----- 세로 높이 = min(컨텐츠높이, 가용높이) ----- */
    const [wrapH, setWrapH] = useState(null);

    const recomputeHeight = () => {
        const wrap   = wrapperRef.current;
        const header = headerRef.current;
        const body   = bodyRef.current;
        if (!wrap || !header || !body) return;

        // ① 실제 테이블 높이
        const headerH = header.offsetHeight || 0;
        const bodyH   = body.scrollHeight || 0;
        const tableH  = headerH + bodyH;
        
        // 방 개수에 따른 최소 높이 계산 (방당 40px + 헤더 + 여유)
        const roomCount = rooms.length;
        const minRequiredHeight = headerH + (roomCount * 40) + 100; // 방당 40px + 충분한 여유

        // ② 화면 가용 높이를 크게 늘려서 내부 스크롤 방지
        const top = wrap.getBoundingClientRect().top;

        // 현재 뷰포트 하단에 겹쳐 보이는 푸터 높이만큼 차감
        let footerOverlap = 0;
        const footerEl = getFooterEl();
        if (footerEl) {
            const vb = window.innerHeight;                   // viewport bottom
            const ft = footerEl.getBoundingClientRect().top; // footer top in viewport
            if (ft < vb) {
                // 푸터가 화면에 들어온 만큼(겹치는 영역)만 빼기
                footerOverlap = vb - Math.max(ft, 0);
                // margin-top이 있으면 포함
                const mt = parseFloat(getComputedStyle(footerEl).marginTop || "0");
                footerOverlap += Math.max(mt, 0);
            }
        }

        // 테이블 전체를 담을 수 있는 컨테이너 높이 계산
        const baseGap = 20; // 기본 여유
        
        // 테이블이 모두 보이려면 필요한 높이 = 실제 테이블 높이 또는 계산된 최소 높이
        const requiredHeight = Math.max(tableH, minRequiredHeight);
        
        // ③ 최종 높이 - 테이블 전체가 스크롤 없이 보이도록 설정
        const finalHeight = requiredHeight + 50; // 테이블 높이 + 여유
        
        setWrapH(finalHeight);
    };

    // 높이 자동 조정으로 변경 - JavaScript 높이 계산 비활성화
    // useEffect(() => {
    //     recomputeHeight();
    //     const onResize = () => recomputeHeight();
    //     window.addEventListener("resize", onResize);
    //     window.addEventListener("orientationchange", onResize);

    //     const ro = new ResizeObserver(recomputeHeight);
    //     ro.observe(document.body);
    //     // 푸터 자체 변화도 감시(선택)
    //     const footerEl = getFooterEl();
    //     let footerRO;
    //     if (footerEl) {
    //         footerRO = new ResizeObserver(recomputeHeight);
    //         footerRO.observe(footerEl);
    //     }

    //     const t = setTimeout(recomputeHeight, 0);
    //     return () => {
    //         window.removeEventListener("resize", onResize);
    //         window.removeEventListener("orientationchange", onResize);
    //         ro.disconnect();
    //         footerRO?.disconnect();
    //         clearTimeout(t);
    //     };
    // }, [rooms.length]);

    /** ----- 휠 가로 전환: 개선된 휠 스크롤 ----- */
    useEffect(() => {
        const horiz = scrollRef.current;
        if (!horiz) return;

        const onWheel = (e) => {
            const wrap = wrapperRef.current;
            const canVertScroll = wrap && wrap.scrollHeight > wrap.clientHeight;
            
            // Shift 키를 누르면 무조건 가로 스크롤
            if (e.shiftKey) {
                horiz.scrollLeft += e.deltaY;
                e.preventDefault();
                return;
            }
            
            // 세로 스크롤이 가능하고, 세로 스크롤이 맨 위/아래에 도달하지 않은 경우
            if (canVertScroll) {
                const isAtTop = wrap.scrollTop <= 0;
                const isAtBottom = wrap.scrollTop >= wrap.scrollHeight - wrap.clientHeight;
                
                // 위/아래 끝에 도달했을 때만 가로 스크롤 허용
                if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
                    horiz.scrollLeft += e.deltaY;
                    e.preventDefault();
                }
                return;
            }
            
            // 세로 스크롤이 불가능한 경우 가로 스크롤
            horiz.scrollLeft += e.deltaY;
            e.preventDefault();
        };
        
        horiz.addEventListener("wheel", onWheel, { passive: false });
        return () => horiz.removeEventListener("wheel", onWheel);
    }, []);

    return (
        <div className="tab-pane fade show active" id="calendar" role="tabpanel">
            <div className="tab-search">
                <div className="tab-search-area">
                    <select value={year} onChange={handleYearChange}>
                        {[2024, 2025, 2026, 2027, 2028].map((y) => (
                            <option key={y} value={y}>{y}년</option>
                        ))}
                    </select>
                    <select value={month} onChange={handleMonthChange}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{i + 1}월</option>
                        ))}
                    </select>
                    <button type="button" onClick={goToday}>오늘</button>
                    {onExportIcal && (
                        <button 
                            type="button" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onExportIcal();
                            }}
                            style={{
                                marginLeft: '10px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                            }}
                        >
                            예약정보 보내기
                        </button>
                    )}
                </div>
                <span>배치 실행시간 : {airbookings[0]?.REG_DTM}</span>
            </div>

            {/* ✅ 세로 스크롤 주체: 내용 넘치면 자동 스크롤, 다 보이면 없음 */}
            <div
                className="calendar-wrapper"
                ref={wrapperRef}
                onClick={hideTooltip}
            >
                <div className="booking-container">
                    <div className="room-list">
                        {rooms.map(r => <div className="room-item" key={r.id}><span>{r.name}</span></div>)}
                    </div>

                    <div className="calendar-scroll" ref={scrollRef}>
                        <div className="calendar-header" ref={headerRef}>
                            {dateList.map(d => (
                                <div className="date-cell" key={toLocalYMD(d)}>{formatHeader(d)}</div>
                            ))}
                        </div>

                        <div className="calendar-body" ref={bodyRef}>
                            {rooms.map(room => (
                                <div className="calendar-row" key={room.id}>
                                    {dateList.map(date => {
                                        const d = toLocalYMD(date);
                                        const roomBookings    = bookings.filter(b => b.room === room.name);
                                        const roomAirBookings = airbookings.filter(b => b.room === room.name);
                                        const roomUnavailable = unavailablePeriods.filter(u => u.room === room.name);
                                        
                                        const booking     = roomBookings.find(b => d >= b.check_in && d < b.check_out);
                                        const isCheckIn   = roomBookings.find(b => d === b.check_in);
                                        const airBooking  = roomAirBookings.find(b => d >= b.check_in && d < b.check_out);
                                        const isAirCheckIn= roomAirBookings.find(b => d === b.check_in);
                                        const unavailable = roomUnavailable.find(u => d >= u.start_date && d < u.end_date);
                                        const isUnavailableStart = roomUnavailable.find(u => d === u.start_date);
                                        return (
                                            <div className="cell" key={`${room.id}-${d}`}>
                                                {isCheckIn && booking && (
                                                    <div 
                                                        className="booking-bar" 
                                                        style={{
                                                            width: `${(getBookingSpanInDates(booking.check_in, booking.check_out) - 2) * CELL_WIDTH}px`,
                                                            backgroundColor: "#1E90FF", height: "70%",
                                                            position: "absolute", top: "50%", transform: "translateY(-50%)",
                                                            left: "40px", zIndex: 1, borderRadius: "5px",
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // 이벤트 전파 막기
                                                            const originalDates = getOriginalDates(booking);
                                                            showTooltip(e, {
                                                                type: "홈페이지 예약",
                                                                customer: booking.name || booking.NAME || "이름 없음",
                                                                room: room.name,
                                                                dates: `${originalDates.checkIn} ~ ${originalDates.checkOut}`
                                                            });
                                                        }}
                                                    />
                                                )}
                                                {isAirCheckIn && airBooking && (
                                                    <div 
                                                        className="booking-bar" 
                                                        style={{
                                                            width: `${(getBookingSpanInDates(airBooking.check_in, airBooking.check_out) - 1) * CELL_WIDTH}px`,
                                                            backgroundColor: "#F54D6E", height: "70%",
                                                            position: "absolute", top: "50%", transform: "translateY(-50%)",
                                                            left: "-40px", zIndex: 2, borderRadius: "5px",
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // 이벤트 전파 막기
                                                            const originalDates = getOriginalDates(airBooking, true); // 외부 예약이므로 true
                                                            showTooltip(e, {
                                                                type: "외부 플랫폼 예약",
                                                                customer: "외부 고객",
                                                                room: room.name,
                                                                dates: `${originalDates.checkIn} ~ ${originalDates.checkOut}`
                                                            });
                                                        }}
                                                    />
                                                )}
                                                {isUnavailableStart && unavailable && (
                                                    <div 
                                                        className="booking-bar" 
                                                        style={{
                                                            width: `${getBookingSpanInDates(unavailable.start_date, unavailable.end_date) * CELL_WIDTH}px`,
                                                            backgroundColor: "#9E9E9E", height: "70%",
                                                            position: "absolute", top: "50%", transform: "translateY(-50%)",
                                                            left: "0px", zIndex: 0, borderRadius: "3px",
                                                            opacity: 0.7,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: "10px", color: "white", fontWeight: "bold"
                                                        }}
                                                    >
                                                        예약불가
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 툴팁 */}
            {tooltip.show && tooltip.content && (
                <div 
                    style={{
                        position: "fixed",
                        left: Math.max(5, Math.min(tooltip.x - 70, window.innerWidth - 170)), // 화면 좌우 경계
                        top: Math.max(5, Math.min(tooltip.y - 90, window.innerHeight - 120)), // 화면 상하 경계
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        zIndex: 1000,
                        pointerEvents: "none",
                        minWidth: "140px",
                        maxWidth: "200px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        lineHeight: "1.3",
                        whiteSpace: "nowrap"
                    }}
                >
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                        {tooltip.content.type}
                    </div>
                    <div>고객: {tooltip.content.customer}</div>
                    <div>객실: {tooltip.content.room}</div>
                    <div>날짜: {tooltip.content.dates}</div>
                </div>
            )}
        </div>
    );
}

export default CalendarTab;
