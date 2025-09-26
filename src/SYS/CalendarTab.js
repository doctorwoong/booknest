import React, { useState, useEffect, useRef, useMemo } from "react";
import "../CSS/style/CalendarTab.css";
import ReservationStatusModal from "../COMPONENT/BASIC/ReservationStatusModal";
import UnavailablePeriodModal from "../COMPONENT/BASIC/UnavailablePeriodModal";
import { apiRequest } from "../Util/api";

function CalendarTab({ rooms = [], bookings = [], airbookings = [], unavailablePeriods = [], onExportIcal, onRefresh }) {
    console.log('CalendarTab 컴포넌트 렌더링됨');
    
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });
    const [reservationModal, setReservationModal] = useState({ isOpen: false, reservation: null });
    const [unavailableModal, setUnavailableModal] = useState({ isOpen: false, room: '', date: '' });
    const [allReservationsForUnavailable, setAllReservationsForUnavailable] = useState([]);
    
    // 자동 예약불가 계산용 데이터 가져오기
    useEffect(() => {
        const fetchAllReservations = async () => {
            try {
                const data = await apiRequest('/calendar-data-for-unavailable', 'POST');
                setAllReservationsForUnavailable(data);
            } catch (error) {
                console.error('자동 예약불가 계산용 데이터 가져오기 오류:', error);
            }
        };
        
        fetchAllReservations();
    }, [onRefresh, bookings, airbookings]); // 예약 데이터가 변경될 때마다 다시 실행
    
    // 모든 예약불가 기간 계산 (수동 + 자동)
    const allUnavailablePeriods = useMemo(() => {
        const autoPeriods = [];
        
        // 자동 예약불가 계산용 데이터 사용 (모든 예약 데이터 + 수동 예약불가 데이터)
        const allReservations = allReservationsForUnavailable;
        
        // 수동 예약불가를 예약 데이터로 변환
        const manualUnavailableAsReservations = unavailablePeriods.map(unavailable => ({
            room: unavailable.room,
            check_in: unavailable.start_date,
            check_out: unavailable.end_date
        }));
        
        // 모든 예약 데이터 + 수동 예약불가 데이터 합치기
        const allData = [...allReservations, ...manualUnavailableAsReservations];
        
        // 객실별로 그룹화
        const reservationsByRoom = {};
        allData.forEach(reservation => {
            if (!reservationsByRoom[reservation.room]) {
                reservationsByRoom[reservation.room] = [];
            }
            reservationsByRoom[reservation.room].push(reservation);
        });
        
        // 각 객실별로 예약 사이의 빈 기간 찾기
        Object.keys(reservationsByRoom).forEach(roomName => {
            const roomReservations = reservationsByRoom[roomName];
            
            if (roomReservations.length < 2) return;
            
            // 날짜순으로 정렬
            roomReservations.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));
            
            // 연속된 예약들 사이의 간격만 계산
            for (let i = 0; i < roomReservations.length - 1; i++) {
                const currentReservation = roomReservations[i];
                const nextReservation = roomReservations[i + 1];
                
                const currentEnd = new Date(currentReservation.check_out);
                const nextStart = new Date(nextReservation.check_in);
                
                // 예약 사이의 빈 기간 계산
                const gapDays = Math.ceil((nextStart - currentEnd) / (1000 * 60 * 60 * 24));
                
                // 3일 미만인 경우만 자동 예약불가로 표시 (3박 가능하면 예약불가 아님)
                if (gapDays > 0 && gapDays < 3) {
                    const unavailableStart = new Date(currentEnd);
                    unavailableStart.setDate(unavailableStart.getDate() - 1);
                    
                    autoPeriods.push({
                        room: roomName,
                        start_date: unavailableStart.toISOString().split('T')[0],
                        end_date: nextStart.toISOString().split('T')[0],
                        reason: '자동 예약불가 (3일 이하)',
                        id: `AUTO_${roomName}_${unavailableStart.getTime()}`,
                        unavailable_type: 'auto'
                    });
                }
            }
        });
        
        // 수동 예약불가와 자동 예약불가 합치기
        const allPeriods = [...unavailablePeriods, ...autoPeriods];
        return allPeriods;
    }, [allReservationsForUnavailable, unavailablePeriods]);

    const scrollRef = useRef(null);    // 가로 스크롤(달력)
    const wrapperRef = useRef(null);   // 세로 스크롤 주체
    const headerRef  = useRef(null);   // 날짜 헤더
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

    const hideTooltip = () => {
        setTooltip({ show: false, x: 0, y: 0, content: null });
    };

    const handleBookingClick = async (booking, isExternal = false) => {
        try {
            // 모든 예약은 API를 통해 DB 원본 데이터 가져오기
            if (!booking.customer_id) {
                alert('예약 ID를 찾을 수 없습니다.');
                return;
            }
            
            const response = await apiRequest(`/reservation/${booking.customer_id}`, 'GET');
            
            if (response.success) {
                setReservationModal({
                    isOpen: true,
                    reservation: response.data
                });
            } else {
                alert('예약 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('예약 정보 가져오기 실패:', error);
            alert('예약 정보를 가져오는 중 오류가 발생했습니다.');
        }
    };

    const handleReservationModalClose = () => {
        setReservationModal({ isOpen: false, reservation: null });
    };

    const handleReservationUpdate = () => {
        // 예약이 업데이트되면 캘린더 데이터만 다시 불러오기
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleEmptyCellClick = (room, date) => {
        setUnavailableModal({
            isOpen: true,
            room: room,
            date: date
        });
    };

    const handleUnavailableModalClose = () => {
        setUnavailableModal({ isOpen: false, room: '', date: '' });
    };

    const handleUnavailablePeriodAdd = () => {
        // 예약불가 기간이 추가되면 부모 컴포넌트에 새로고침 요청
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleUnavailablePeriodDelete = async (customerId) => {
        if (!window.confirm('이 예약불가 기간을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiRequest(`/delete-unavailable-period/${customerId}`, 'DELETE');
            
            if (response.success) {
                alert('예약불가 기간이 삭제되었습니다.');
                if (onRefresh) {
                    onRefresh();
                }
            } else {
                alert('예약불가 기간 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('예약불가 기간 삭제 오류:', error);
            alert('예약불가 기간 삭제 중 오류가 발생했습니다.');
        }
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
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
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

            {/* 세로 스크롤 주체: 내용 넘치면 자동 스크롤, 다 보이면 없음 */}
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
                                        const roomUnavailable = allUnavailablePeriods.filter(u => u.room === room.name);
                                        
                                        const booking     = roomBookings.find(b => d >= b.check_in && d < b.check_out);
                                        const isCheckIn   = roomBookings.find(b => d === b.check_in);
                                        const airBooking  = roomAirBookings.find(b => d >= b.check_in && d < b.check_out);
                                        const isAirCheckIn= roomAirBookings.find(b => d === b.check_in);
                                        const manualUnavailable = roomUnavailable.find(u => d >= u.start_date && d < u.end_date && u.unavailable_type !== 'auto');
                                        const isManualUnavailableStart = roomUnavailable.find(u => d === u.start_date && u.unavailable_type !== 'auto');
                                        const autoUnavailable = roomUnavailable.find(u => d >= u.start_date && d < u.end_date && u.unavailable_type === 'auto');
                                        const isAutoUnavailableStart = roomUnavailable.find(u => d === u.start_date && u.unavailable_type === 'auto');
                                        return (
                                            <div 
                                                className="cell" 
                                                key={`${room.id}-${d}`}
                                                onClick={(e) => {
                                                    // 예약이나 수동 예약불가 기간이 없는 빈 칸인 경우에만 클릭 처리
                                                    if (!booking && !airBooking && !manualUnavailable) {
                                                        handleEmptyCellClick(room.name, d);
                                                    }
                                                }}
                                                style={{
                                                    cursor: (!booking && !airBooking && !manualUnavailable) ? 'pointer' : 'default'
                                                }}
                                            >
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
                                                            handleBookingClick(booking, false);
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
                                                            handleBookingClick(airBooking, true);
                                                        }}
                                                    />
                                                )}
                                                {/* 수동 예약불가 (예약과 함께 처리) */}
                                                {isManualUnavailableStart && manualUnavailable && (
                                                    <div 
                                                        className="booking-bar manual-unavailable" 
                                                        style={{
                                                            width: `${(getBookingSpanInDates(manualUnavailable.start_date, manualUnavailable.end_date)) * CELL_WIDTH}px`,
                                                            backgroundColor: "#FF9800", 
                                                            height: "70%",
                                                            position: "absolute", 
                                                            top: "50%", 
                                                            left: "-40px",
                                                            transform: "translateY(-50%)",
                                                            zIndex: 1, 
                                                            borderRadius: "3px",
                                                            opacity: 1,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: "10px", color: "white", fontWeight: "bold",
                                                            cursor: "pointer",
                                                            border: "1px solidrgb(230, 81, 0)"
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('수동 예약불가 클릭:', manualUnavailable);
                                                            console.log('ID:', manualUnavailable.id);
                                                            console.log('원본 날짜:', manualUnavailable.original_date);
                                                            handleUnavailablePeriodDelete(manualUnavailable.id);
                                                        }}
                                                        title="클릭하여 수동 예약불가 기간 삭제"
                                                    >
                                                        수동예약불가
                                                    </div>
                                                )}
                                                
                                                {/* 자동 예약불가 (별도 처리) */}
                                                {isAutoUnavailableStart && autoUnavailable && (
                                                    <div 
                                                        className="booking-bar auto-unavailable" 
                                                        style={{
                                                            width: `${(getBookingSpanInDates(autoUnavailable.start_date, autoUnavailable.end_date) - 1) * CELL_WIDTH}px`,
                                                            backgroundColor: "#9E9E9E", 
                                                            height: "70%",
                                                            position: "absolute", 
                                                            top: "50%", 
                                                            transform: "translateY(-50%)",
                                                            left: "80px", 
                                                            zIndex: 0, 
                                                            borderRadius: "3px",
                                                            opacity: 0.6,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: "10px", color: "white", fontWeight: "bold",
                                                            cursor: "default",
                                                            border: "1px solid #757575"
                                                        }}
                                                        title="자동 예약불가 (3일 이하) - 삭제 불가"
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
            
            {/* 예약 현황 모달 */}
            <ReservationStatusModal
                isOpen={reservationModal.isOpen}
                onClose={handleReservationModalClose}
                reservation={reservationModal.reservation}
                onUpdate={handleReservationUpdate}
            />
            
            {/* 예약불가 기간 추가 모달 */}
            <UnavailablePeriodModal
                isOpen={unavailableModal.isOpen}
                onClose={handleUnavailableModalClose}
                selectedRoom={unavailableModal.room}
                selectedDate={unavailableModal.date}
                onAdd={handleUnavailablePeriodAdd}
            />
        </div>
    );
}

export default CalendarTab;
