import React, { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // 기본 스타일
import '../CSS/style/CalendarStyles.css';
import {useNavigate} from "react-router-dom"; // 커스텀 스타일

function ReservationCalendar({ onConfirm }) {
    const [dates, setDates] = useState([]); // 기존 예약된 날짜 배열
    const [checkInDate, setCheckInDate] = useState(null); // 체크인 날짜
    const [checkOutDate, setCheckOutDate] = useState(null); // 체크아웃 날짜
    const [isFormVisible, setFormVisible] = useState(false); // 예약 폼 표시 여부

    const navigate = useNavigate();

    // 날짜 선택 핸들러
    const onDateClick = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            alert("과거 날짜는 선택할 수 없습니다.");
            return;
        }

        if (!checkInDate || (checkInDate && checkOutDate)) {
            setCheckInDate(date);
            setCheckOutDate(null);
            setFormVisible(true);
        } else {
            if (date < checkInDate) {
                alert("체크아웃 날짜는 체크인 날짜 이후여야 합니다.");
                return;
            }
            setCheckOutDate(date);
        }
    };

    // 예약 확인 핸들러
    const handleConfirm = () => {
        if (!checkInDate || !checkOutDate) {
            alert("체크인 및 체크아웃 날짜를 모두 선택해주세요.");
            return;
        }

        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const formattedData = `${checkInDate.getFullYear()}년 ${checkInDate.getMonth() + 1}월 ${checkInDate.getDate()}일 ~ ${checkOutDate.getFullYear()}년 ${checkOutDate.getMonth() + 1}월 ${checkOutDate.getDate()}일`;

        navigate("/", { state: { checkInDate , checkOutDate } });

        setFormVisible(false);
        setCheckInDate(null);
        setCheckOutDate(null);
    };

    // 날짜 초기화 핸들러
    const handleReset = () => {
        setCheckInDate(null);
        setCheckOutDate(null);
        setFormVisible(false);
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
        if (checkInDate && checkOutDate && date >= checkInDate && date <= checkOutDate) {
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
        <div style={{ width: "100%", margin: "auto", backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2>예약 캘린더</h2>
            <Calendar tileClassName={tileClassName} onClickDay={onDateClick} />
            {isFormVisible && (
                <div>
                    <h3>예약 정보</h3>
                    {checkInDate && <p>체크인 날짜: {checkInDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>}
                    {checkOutDate && <p>체크아웃 날짜: {checkOutDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>}
                    {checkInDate && checkOutDate && (
                        <p>
                            예약 기간: {checkInDate.getFullYear()}년 {checkInDate.getMonth() + 1}월 {checkInDate.getDate()}일
                            ~ {checkOutDate.getFullYear()}년 {checkOutDate.getMonth() + 1}월 {checkOutDate.getDate()}일
                        </p>
                    )}
                    {checkInDate && checkOutDate && (
                        <p>
                            총 {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))}박 {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) + 1}일
                        </p>
                    )}
                    <button className="btn btn-primary" onClick={handleConfirm}>확인</button>
                    <button className="btn btn-secondary" onClick={handleReset} style={{marginLeft: '10px'}}>초기화</button>
                </div>
            )}
            <style>{`
                .reserved {
                    background-color: lightblue;
                    border: 1px solid blue;
                    color: black;
                }
                .past-date {
                    background-color: #f0f0f0;
                    color: #555;
                }
                .selected-range {
                    background-color: rgba(135, 206, 250, 0.3); 
                    color: black;
                }
                
                .selected-checkin {
                    background-color: #00aaff;
                    color: white;
                }
                
                .selected-checkout {
                    background-color: #ffaa00;
                    color: white;
                }
                .saturday {
                    color: blue;
                }

            `}</style>
        </div>
    );
}

export default ReservationCalendar;
