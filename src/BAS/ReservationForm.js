import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../CSS/style/style.css";
import { formatDate } from "../Util/utils";
import { apiRequest } from "../Util/api";
import {useTranslation} from "react-i18next";

function ReservationForm() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        passport: "",
        checkInDate: "",
        checkOutDate: "",
        adults: 2,
        children: 0,
        infants: 0,
        pets: 0,
    });

    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location || {};
    const { room_number, checkInDate, checkOutDate, price } = state || {}; // 전달된 데이터

    const [totalPrice, setTotalPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
    const nightlyRate = price;
    const { t } = useTranslation();

    // 날짜 차이 계산 및 총 가격 계산
    useEffect(() => {
        if (checkInDate && checkOutDate) {
            const startDate = new Date(
                checkInDate.substring(0, 4),
                checkInDate.substring(4, 6) - 1,
                checkInDate.substring(6, 8)
            );
            const endDate = new Date(
                checkOutDate.substring(0, 4),
                checkOutDate.substring(4, 6) - 1,
                checkOutDate.substring(6, 8)
            );

            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let discount = 0;
            if (diffDays >= 30) {
                discount = 0.3; // 30% 할인
            } else if (diffDays >= 8) {
                discount = 0.15; // 15% 할인
            }

            const calculatedPrice = diffDays * nightlyRate * (1 - discount);
            setTotalPrice(calculatedPrice);
        } else {
            setTotalPrice(0); // 날짜가 없는 경우 기본값
        }
    }, [checkInDate, checkOutDate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const reservationData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            passport: formData.passport,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            title: room_number,
            price: totalPrice,
        };

        setIsLoading(true); // 로딩 시작
        try {
            const insertResponse = await apiRequest("/insertReservation", "POST", reservationData);

            if (insertResponse) {
                // ✅ 예약 신청 시 사장님께 SMS 전송
                try {
                    const message = `[노량진 스튜디오] ${formData.name}님이 예약하셨습니다.\n객실: ${room_number}\n체크인: ${formatDate(checkInDate)}\n체크아웃: ${formatDate(checkOutDate)}\n가격: ₩${totalPrice.toLocaleString()}`;
                    
                    // 환경변수에서 전화번호 가져오기 (개발/운영 환경 구분)
                    const adminPhonesEnv = process.env.NODE_ENV === 'production' 
                        ? process.env.REACT_APP_ADMIN_PHONES 
                        : process.env.REACT_APP_ADMIN_PHONES_DEV;
                    
                    const recipients = adminPhonesEnv 
                        ? adminPhonesEnv.split(',').map(phone => phone.trim())
                        : ["01092341232"]; // 기본값
                    
                    // 번호 배열을 돌면서 문자 보내기
                    for (const phone of recipients) {
                        await apiRequest("/send-check-in-sms", "POST", {
                            phone: phone,
                            message: message
                        });
                    }
                    console.log("✅ 예약 신청 SMS 전송 완료");
                } catch (smsError) {
                    console.error("❌ 예약 신청 SMS 전송 실패:", smsError);
                    // SMS 실패해도 예약은 성공으로 처리
                }

                alert(t("66"));
                window.location.href = "/";
            } else {
                alert(t("67"));
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Error:", error);
            window.location.href = "/";
        } finally {
            setIsLoading(false); // 로딩 종료
        }


    };

    let preCheckInDate = formatDate(checkInDate)
    let preCheckOutDate = formatDate(checkOutDate)

    return (
        <div className="container mt-5">
            <h1 className="mt-3">{room_number}{t("9")}</h1>
            <div className="text-muted">{t("68")}</div>
            <div className="checkDate2">
                <div>
                    <p>{t("69")}</p>
                    <b>{preCheckInDate}</b>
                </div>
                <div>
                    <p>{t("70")}</p>
                    <b>{preCheckOutDate}</b>
                </div>
            </div>
            <hr/>
            <div className="checkCost">
                <div>
                    <span>{t("71")}(KRW)</span>
                </div>
                <div>
                    <b>₩{totalPrice.toLocaleString()}</b>
                </div>
            </div>

            <div className="discription">
                <small>• {t("72")}</small>
                <br/>
                <small>• {t("73")}</small>
                <br/>
                <small>• {t("74")}</small>
                <br/>
                <small>• {t("75")}:</small>
                <br/>
                <small>&nbsp;&nbsp;◦ {t("76")}</small>
                <br/>
                <small>&nbsp;&nbsp;◦ {t("77")}</small>
            </div>
            <hr/><br/>
            <div className="row">
                <div className="col-md-12">
                    <h3><b>{t("78")}</b></h3>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t("79")}</label>
                                <input type="text" className="form-control" name="name" value={formData.name}
                                       onChange={handleChange} placeholder={t("80")} required/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t("81")}</label>
                                <input type="tel" className="form-control" name="phone" value={formData.phone}
                                       onChange={handleChange} placeholder={t("82")} required/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t("83")}</label>
                                <input type="email" className="form-control" name="email" value={formData.email}
                                       onChange={handleChange} placeholder={t("84")} required/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t("85")}</label>
                                <input type="text" className="form-control" name="passport" value={formData.passport}
                                       onChange={handleChange} placeholder={t("86")}/>
                            </div>
                        </div>
                        <br/>
                        <button type="submit" className="reverseBtn2" disabled={isLoading}>
                            {isLoading ? t("87") + "..." : t("88")}
                        </button>
                        {isLoading && (
                            <div className="text-center mt-3">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReservationForm;
