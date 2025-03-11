import React, { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // 기본 스타일
import '../CSS/style/CalendarStyles.css'; // 커스텀 스타일
import { useNavigate } from "react-router-dom";
import { formatDateToYYYYMMDD , formatDate } from "../Util/utils";
import {useTranslation} from "react-i18next"; // 유틸리티 함수 가져오기

function ReservationCalendar() {
    const [dates, setDates] = useState([]); // 기존 예약된 날짜 배열
    const [checkInDate, setCheckInDate] = useState(null); // 체크인 날짜
    const [checkOutDate, setCheckOutDate] = useState(null); // 체크아웃 날짜
    const [isFormVisible, setFormVisible] = useState(false); // 예약 폼 표시 여부
    const [isValidStay, setIsValidStay] = useState(true); // 최소 3박 유효성 체크
    const { t, i18n } = useTranslation();

    const navigate = useNavigate();

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
        <div style={{ width: "100%", margin: "auto", backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <br/>
            <h2><b>{t("56")}</b></h2>
            <p style={{color:"#5A5A5A"}}>{t("57")}</p>
            <Calendar locale={i18n.language === "ko" ? "ko-KR" : "en-US"} tileClassName={tileClassName} onClickDay={onDateClick} />
            {isFormVisible && (
                <div>
                    <br/><br/>
                    <h3>{t("58")}</h3>
                    <p style={{color: "#5A5A5A"}}>{t("59")}</p>
                    <br/>
                    <div className="checkDate">
                        <b style={{marginRight: "15%"}}>{t("60")}</b>
                        <b>{checkInDate && <b>{formatDate(formatDateToYYYYMMDD(checkInDate))}</b>}</b>
                        <br/>
                        <b style={{marginRight: "12%"}}>{t("61")}</b>
                        <b>{checkOutDate && <b>{formatDate(formatDateToYYYYMMDD(checkOutDate))}</b>}</b>
                        <p style={{textAlign:"right"}}>
                            {checkInDate && checkOutDate && (
                                <b>np
                                    {t("62")} {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))}{t("42")} {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) + 1}{t("63")}
                                </b>
                            )}
                        </p>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '1%', width: '100%', height: '50px'}}>
                        <button onClick={handleConfirm} disabled={!isValidStay} style={{width: '48%', fontSize: '20px',backgroundColor:'#F54D6E',color:"white"}}>
                            {t("64")}
                        </button>
                        <button onClick={handleReset} style={{width: '48%', fontSize: '20px',backgroundColor:'#F5F5F5',color:"black"}}>
                            {t("65")}
                        </button>
                    </div>
                    <br/><br/>
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
                .saturday {
                    color: blue;
                }
                .btn:disabled {
                    background-color: grey;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}

export default ReservationCalendar;
