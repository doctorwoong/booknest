import React, { useState, useEffect, useRef } from "react";
import '../CSS/style/CalendarTab.css';

function CalendarTab({ rooms, bookings, airbookings = [] }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const scrollRef = useRef();
    const hasScrolledToToday = useRef(false);

    const generateDateList = () => {
        const dates = [];
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear() + 2, 11, 31);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    };

    const dateList = generateDateList();

    const scrollToDate = (targetDate) => {
        const index = dateList.findIndex(
            (d) => d.toISOString().split("T")[0] === targetDate.toISOString().split("T")[0]
        );
        if (scrollRef.current && index >= 0) {
            scrollRef.current.scrollLeft = index * 80;
        }
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
        return `${day}일 ${weekday}`;
    };

    const getBookingSpanInDates = (start, end) => {
        const s = new Date(start);
        s.setDate(s.getDate() - 1); // ✅ check-in 날짜 하루 전부터 시작
        const e = new Date(end);
        return Math.max((e - s) / (1000 * 60 * 60 * 24), 1);
    };


    useEffect(() => {
        if (!hasScrolledToToday.current) {
            const todayFormatted = today.toISOString().split("T")[0];
            const index = dateList.findIndex(
                (d) => d.toISOString().split("T")[0] === todayFormatted
            );
            if (scrollRef.current && index >= 0) {
                scrollRef.current.scrollLeft = index * 80;
                hasScrolledToToday.current = true;
            }
        }
    }, []);

    useEffect(() => {
        let timeout;
        const handleScroll = () => {
            if (!scrollRef.current) return;
            const scrollLeft = scrollRef.current.scrollLeft;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const index = Math.floor(scrollLeft / 80);
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
                </div>
                <span>배치 실행시간 : {airbookings[0]?.REG_DTM}</span>
            </div>

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
                            <div className="date-cell" key={date.toISOString()}>
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
                                        const formattedDate = date.toISOString().split("T")[0];

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
                                        const isAirCheckIn = roomAirBookings.find(b => {
                                            const checkIn = new Date(b.check_in);
                                            return formattedDate === checkIn.toISOString().split("T")[0]; // ✅ 원래 날짜 그대로 비교
                                        });



                                        return (
                                            <div className="cell" key={`${room.id}-${formattedDate}`}>
                                                {isCheckIn && booking && (
                                                    <div
                                                        className="booking-bar"
                                                        style={{
                                                            width: `${(getBookingSpanInDates(booking.check_in, booking.check_out) - 2) * 80}px`,
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
                                                            width: `${(getBookingSpanInDates(airBooking.check_in, airBooking.check_out) - 1) * 80}px`,
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
        </div>
    );
}

export default CalendarTab;
