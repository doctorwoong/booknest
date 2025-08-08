import React, { useState, useEffect, useRef, useMemo } from "react";
import '../CSS/style/CalendarTab.css';

function CalendarTab({ rooms = [], bookings = [], airbookings = [] }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const scrollRef = useRef(null);
    const hasScrolledToToday = useRef(false);

    // ✅ 로컬 타임존 기준 YYYY-MM-DD
    const toLocalYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const generateDateList = () => {
        const dates = [];
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear() + 2, 11, 31);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    };

    // ✅ 날짜 리스트는 한 번만 생성
    const dateList = useMemo(() => generateDateList(), []);

    // ✅ 데이터 준비 플래그 (Hook 아님)
    const isDataReady = rooms.length > 0 && dateList.length > 0;

    const CELL_WIDTH = 80;

    const scrollToDate = (targetDate) => {
        const index = dateList.findIndex(
            (d) => toLocalYMD(d) === toLocalYMD(targetDate) // ← 로컬 비교
        );
        const el = scrollRef.current;
        if (!el || index < 0) return;

        // 가운데 정렬 + 범위 보정
        let targetLeft = index * CELL_WIDTH - el.clientWidth / 2 + CELL_WIDTH / 2;
        const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        if (targetLeft < 0) targetLeft = 0;
        if (targetLeft > maxLeft) targetLeft = maxLeft;

        el.scrollLeft = targetLeft;
        el.scrollTo({ left: targetLeft, behavior: "smooth" }); // 기존 동작 유지
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
        const isToday = toLocalYMD(date) === toLocalYMD(today); // ← 로컬 비교

        return (
            <span style={{ fontWeight: isToday ? "bold" : "normal" }}>
                {day}일 {weekday}
            </span>
        );
    };

    const getBookingSpanInDates = (start, end) => {
        const s = new Date(start);
        s.setDate(s.getDate() - 1); // ✅ check-in 하루 전부터
        const e = new Date(end);
        return Math.max((e - s) / (1000 * 60 * 60 * 24), 1);
    };


    // ✅ 초기 스크롤: 데이터 준비되고 레이아웃 잡힌 뒤 "한 번만"
    useEffect(() => {
        if (!isDataReady || hasScrolledToToday.current) return;

        const el = scrollRef.current;
        if (!el) return;

        const run = () => {
            if (el.scrollWidth <= el.clientWidth) {
                requestAnimationFrame(run);
                return;
            }
            scrollToDate(today);
            hasScrolledToToday.current = true;
        };

        requestAnimationFrame(run);
    }, [isDataReady]); // 의존성 OK

    // ✅ 스크롤 동기화 리스너 (항상 등록/해제, 내부에서 계산)
    useEffect(() => {
        let timeout;
        const handleScroll = () => {
            if (!scrollRef.current) return;
            const scrollLeft = scrollRef.current.scrollLeft;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const index = Math.floor(scrollLeft / CELL_WIDTH);
                const newDate = dateList[index];
                if (newDate) {
                    const newYear = newDate.getFullYear();
                    const newMonth = newDate.getMonth();
                    const day = newDate.getDate();
                    if ((newYear !== year || newMonth !== month) && day >= 1) {
                        setYear(newYear);
                        setMonth(newMonth);
                    }
                }
            }, 100);
        };

        const ref = scrollRef.current;
        if (ref) ref.addEventListener("scroll", handleScroll);
        return () => ref?.removeEventListener("scroll", handleScroll);
    }, [dateList, year, month]);

    // (선택) 세로 휠 → 가로 스크롤
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                el.scrollLeft += e.deltaY;
                e.preventDefault();
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
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
                </div>
                <span>배치 실행시간 : {airbookings[0]?.REG_DTM}</span>
            </div>

            {!isDataReady ? (
                <div className="calendar-loading">달력을 불러오는 중…</div>
            ) : (
                <div className="booking-container">
                    <div className="room-list">
                        {rooms.map((room) => (
                            <div className="room-item" key={room.id}>
                                <span>{room.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="calendar-scroll" ref={scrollRef}>
                        <div className="calendar-header">
                            {dateList.map((date) => (
                                <div className="date-cell" key={toLocalYMD(date)}>
                                    {formatHeader(date)}
                                </div>
                            ))}
                        </div>

                        <div className="calendar-body">
                            {rooms.map((room) => {
                                const roomBookings = bookings.filter(b => b.room === room.name);
                                const roomAirBookings = airbookings.filter(b => b.room === room.name);

                                return (
                                    <div className="calendar-row" key={room.id}>
                                        {dateList.map((date) => {
                                            // ✅ 로컬 기준 YYYY-MM-DD
                                            const formattedDate = toLocalYMD(date);

                                            const booking = roomBookings.find(b =>
                                                formattedDate >= b.check_in &&
                                                formattedDate < b.check_out
                                            );
                                            const isCheckIn = roomBookings.find(b =>
                                                formattedDate === b.check_in
                                            );

                                            const airBooking = roomAirBookings.find(b =>
                                                formattedDate >= b.check_in &&
                                                formattedDate < b.check_out
                                            );
                                            const isAirCheckIn = roomAirBookings.find(b =>
                                                formattedDate === b.check_in
                                            );

                                            return (
                                                <div className="cell" key={`${room.id}-${formattedDate}`}>
                                                    {isCheckIn && booking && (
                                                        <div
                                                            className="booking-bar"
                                                            style={{
                                                                width: `${(getBookingSpanInDates(booking.check_in, booking.check_out) - 2) * CELL_WIDTH}px`,
                                                                backgroundColor: "#1E90FF",
                                                                height: "70%",
                                                                position: "absolute",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                left: "40px",
                                                                zIndex: 1,
                                                                borderRadius: "5px",
                                                            }}
                                                        ></div>
                                                    )}

                                                    {isAirCheckIn && airBooking && (
                                                        <div
                                                            className="booking-bar"
                                                            style={{
                                                                width: `${(getBookingSpanInDates(airBooking.check_in, airBooking.check_out) - 1) * CELL_WIDTH}px`,
                                                                backgroundColor: "#F54D6E",
                                                                height: "70%",
                                                                position: "absolute",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                left: "-40px",
                                                                zIndex: 2,
                                                                borderRadius: "5px",
                                                            }}
                                                        ></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarTab;
