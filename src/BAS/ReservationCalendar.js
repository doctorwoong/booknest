import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // 기본 스타일
import '../CSS/style/CalendarStyles.css'; // 커스텀 스타일
import { useNavigate } from "react-router-dom";
import { formatDateToYYYYMMDD , formatDate } from "../Util/utils";
import {useTranslation} from "react-i18next"; // 유틸리티 함수 가져오기
import { apiRequest } from "../Util/api";

function ReservationCalendar() {
    const [dates, setDates] = useState([]); // 기존 예약된 날짜 배열
    const [checkInDate, setCheckInDate] = useState(null); // 체크인 날짜
    const [checkOutDate, setCheckOutDate] = useState(null); // 체크아웃 날짜
    const [isFormVisible, setFormVisible] = useState(false); // 예약 폼 표시 여부
    const [isValidStay, setIsValidStay] = useState(true); // 최소 3박 유효성 체크
    const [isSyncing, setIsSyncing] = useState(false); // Booking.com 동기화 중 상태
    const [syncComplete, setSyncComplete] = useState(false); // 동기화 완료 상태
    const { t, i18n } = useTranslation();

    const navigate = useNavigate();

    // 🔄 Booking.com 실시간 동기화 함수
    const syncBookingData = async () => {
        try {
            setIsSyncing(true);
            console.log("🔄 Booking.com 실시간 동기화 시작...");
            
            const response = await apiRequest("/sync-booking-realtime", "POST");
            
            if (response.success) {
                console.log("✅ Booking.com 동기화 완료");
                setSyncComplete(true);
            } else {
                console.warn("⚠️ Booking.com 동기화 실패:", response.message);
            }
        } catch (error) {
            console.error("❌ Booking.com 동기화 오류:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    // 📅 페이지 로드 시 병렬로 동기화 실행
    useEffect(() => {
        // 페이지 로드와 동시에 백그라운드에서 동기화 시작
        syncBookingData();
    }, []);

    // 날짜 선택 핸들러
    const onDateClick = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            alert(t("147"));
            return;
        }

        if (!checkInDate || (checkInDate && checkOutDate)) {
            setCheckInDate(date);
            setCheckOutDate(null);
            setFormVisible(true);
            setIsValidStay(true);
        } else {
            if (date < checkInDate) {
                alert(t("52"));
                return;
            }
            setCheckOutDate(date);

            // 최소 3박 유효성 검사
            const nights = Math.ceil((date - checkInDate) / (1000 * 60 * 60 * 24));
            if (nights < 3) {
                alert(t("53"));
                setIsValidStay(false);
            } else {
                setIsValidStay(true);
            }
        }
    };

    // 예약 확인 핸들러
    const handleConfirm = () => {
        if (!checkInDate || !checkOutDate) {
            alert(t("54"));
            return;
        }

        if (!isValidStay) {
            alert(t("55"));
            return;
        }

        // 🔄 동기화 중이면 안내 메시지 표시
        if (isSyncing) {
            alert(t("161"));
            return;
        }

        const formattedCheckIn = formatDateToYYYYMMDD(checkInDate);
        const formattedCheckOut = formatDateToYYYYMMDD(checkOutDate);

        navigate("/", { state: { checkInDate: formattedCheckIn, checkOutDate: formattedCheckOut } });

        setFormVisible(false);
        setCheckInDate(null);
        setCheckOutDate(null);
    };

    // 날짜 초기화 핸들러
    const handleReset = () => {
        setCheckInDate(null);
        setCheckOutDate(null);
        setFormVisible(false);
        setIsValidStay(true);
    };

    // 예약된 날짜 스타일 및 과거 날짜 처리
    const tileClassName = ({ date, view }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return "past-date";
        }
        if (view === "month" && dates.some((d) => d.getTime() === date.getTime())) {
            return "reserved";
        }

        // 선택된 날짜 범위
        if (checkInDate && checkOutDate && date > checkInDate && date < checkOutDate) {
            return "selected-range";
        }

        // 체크인 및 체크아웃 날짜
        if (checkInDate && date.getTime() === checkInDate.getTime()) {
            return "selected-checkin";
        }
        if (checkOutDate && date.getTime() === checkOutDate.getTime()) {
            return "selected-checkout";
        }

        if (date.getDay() === 6) { // 6은 토요일
            return "saturday";
        }
    };

    return (
        <div style={{ width: "100%", margin: "auto", backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",marginTop:"50px"}}>
            <br/>
            <h2><b>{t("56")}</b></h2>
            <p style={{color:"#5A5A5A",marginBottom:"30px"}}>{t("57")}</p>
            
            {/* 🔄 동기화 상태 표시 */}
            {isSyncing && (
                <div style={{
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    color: '#1976d2'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #1976d2',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span>{t("160")}</span>
                    </div>
                </div>
            )}
            
            <Calendar locale={i18n.language === "ko" ? "ko-KR" : "en-US"} tileClassName={tileClassName} onClickDay={onDateClick} />
            {isFormVisible && (
                <div className="calendarForm">
                    <br/><br/>
                    <h3>{t("58")}</h3>
                    <p style={{color: "#5A5A5A"}} className="calendarFormP">{t("59")}</p>
                    <br/>
                    <div className="checkDate">
                        <div className="date-row">
                            <b>{t("60")}</b>
                            <b>{checkInDate && formatDate(formatDateToYYYYMMDD(checkInDate))}</b>
                        </div>
                        <div className="date-row">
                            <b>{t("61")}</b>
                            <b>{checkOutDate && formatDate(formatDateToYYYYMMDD(checkOutDate))}</b>
                        </div>
                        <p style={{textAlign: "right", marginTop: "20px"}}>
                            {checkInDate && checkOutDate && (
                                <b>
                                    {t("62")} {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))}{t("42")}{" "}
                                    {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) + 1}{t("63")}
                                </b>
                            )}
                        </p>
                    </div>


                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1%',
                        width: '100%',
                        height: '50px'
                    }}>
                        <button onClick={handleConfirm} disabled={!isValidStay}
                                style={{width: '49%', fontSize: '20px', backgroundColor: '#F54D6E', color: "white",borderRadius:"8px",border:"none"}}>
                            {t("64")}
                        </button>
                        <button onClick={handleReset}
                                style={{width: '49%', fontSize: '20px', backgroundColor: '#F5F5F5', color: "black",borderRadius:"8px",border:"none"}}>
                            {t("65")}
                        </button>
                    </div>
                    <br/><br/>
                </div>
            )}
            <style>{`
                .reserved {background-color: lightblue;border: 1px solid blue;color: black;}
                .past-date {background-color: #f0f0f0;color: #555;}
                .saturday {color: blue;}
                .btn:disabled {background-color: grey;cursor: not-allowed;}
                .checkDate .date-row {display: flex;justify-content: space-between;margin-bottom: 8px;}
                @media (max-width: 768px) {
                  .react-calendar {width: 100% !important;font-size: 11px !important;border-radius: 10px;}
                  .react-calendar__tile {padding: 0.75em 0 !important;}
                  .react-calendar__navigation {flex-wrap: wrap;gap: 4px;justify-content: center;color: black !important;}
                  .react-calendar__month-view__weekdays {font-size: 13px !important;color: black !important;}
                  .react-calendar__tile abbr {font-size: 14px;}
                  .react-calendar__tile--now {background: #f5f5f5 !important;border-radius: 50%;}
                  .react-calendar__tile--active {background: #F54D6E !important;color: white;border-radius: 50%;}
                  .react-calendar__tile:disabled {background: #eee;color: #ccc;}
                  .checkDate b {font-size:17px}
                  .calendarForm h3 {font-size:21px}
                  .calendarForm .calendarFormP {font-size:14px}
                }

                
            `}</style>
        </div>
    );
}

export default ReservationCalendar;
