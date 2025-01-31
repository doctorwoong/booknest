import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { formatDate } from "../Util/utils";
import { apiRequest } from "../Util/api";

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
    const { room_number, images, checkInDate, checkOutDate, adults, price } = state || {}; // 전달된 데이터

    const [totalPrice, setTotalPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
    const nightlyRate = price;

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
            price: totalPrice.toLocaleString(),
        };

        console.log("메일에 던지는 json : " + JSON.stringify(reservationData));
        setIsLoading(true); // 로딩 시작
        try {
            // 두 개의 API 요청을 병렬로 실행
            const [emailResponse, insertResponse] = await Promise.all([
                apiRequest("/send-reservation","POST", reservationData),
                apiRequest("/insert-reservation","POST", reservationData),
            ]);

            if (emailResponse && insertResponse) {
                alert("예약이 완료되었습니다! 이메일을 확인해주세요.");
                navigate("/");
            } else {
                alert("예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
                navigate("/");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("예약이 완료되었습니다! 이메일을 확인해주세요.");
            navigate("/");
        } finally {
            setIsLoading(false); // 로딩 종료
        }


    };

    let preCheckInDate = formatDate(checkInDate)
    let preCheckOutDate = formatDate(checkOutDate)
    let url = `/resource/img/${room_number}/`;

    return (
        <div className="container mt-5">
            <h4 className="text-primary">숙소</h4>
            <div className="text-muted">예약 완료 후 무료 취소 가능</div>
            <h1 className="mt-3">{room_number}호</h1>
            <p className="text-secondary">체크인 : {preCheckInDate}</p>
            <hr />

            <div className="row">
                <div className="col-md-6">
                    <h5>예약 요청</h5>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">이름</label>
                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="예약자의 이름을 입력해주세요"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">전화번호</label>
                            <input
                                type="tel"
                                className="form-control"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="예약자의 전화번호를 입력해주세요"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">이메일</label>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="예약자의 이메일을 입력해주세요"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">여권번호 / 주민번호 / ID</label>
                            <input
                                type="text"
                                className="form-control"
                                name="passport"
                                value={formData.passport}
                                onChange={handleChange}
                                placeholder="여권번호/주민번호/ID 중 하나를 입력하세요"

                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">체크인 날짜</label>
                            <input
                                type="text"
                                className="form-control"
                                name="checkinDate"
                                value={preCheckInDate}
                                readOnly
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">체크아웃 날짜</label>
                            <input
                                type="text"
                                className="form-control"
                                name="checkoutDate"
                                value={preCheckOutDate}
                                readOnly
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">성인 인원</label>
                            <input
                                type="number"
                                className="form-control"
                                name="adults"
                                value={adults}
                                readOnly
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                            {isLoading ? "처리 중..." : "예약하기"}
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

                <div className="col-md-6">
                    <div className="card">
                        <img
                            src={url + images?.[0] || "https://via.placeholder.com/600x400"}
                            className="card-img-top"
                            alt={room_number}
                        />
                        <div className="card-body">
                            <h5 className="card-title">{room_number}호</h5>
                            <p className="text-muted">
                            체크인: {preCheckInDate || "미정"}
                                <br />
                                체크아웃: {preCheckOutDate || "미정"}
                            </p>
                            <b> 총 합계(KRW) : {totalPrice.toLocaleString()}원</b>
                            <br />
                            <small>• 결제는 아래의 통화로 가능합니다: USD (미국 달러), EUR (유로), KRW (한국 원화)</small>
                            <br />
                            <small>• 결제는 체크인 날짜에 직접 지불하시면 됩니다.</small>
                            <br />
                            <small>• 환율은 지불 시점의 환율을 적용합니다.</small>
                            <br />
                            <small>• 결제 금액은 숙박 일수에 따라 할인율이 적용됩니다:</small>
                            <br />
                            <small>&nbsp;&nbsp;◦ 8일 이상 숙박 시, 총 금액의 15% 할인</small>
                            <br />
                            <small>&nbsp;&nbsp;◦ 30일 이상 숙박 시, 총 금액의 30% 할인</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReservationForm;
