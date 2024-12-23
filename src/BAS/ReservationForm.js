import React, {useEffect, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function ReservationForm() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
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
    const { title, content, img ,checkInDate ,checkOutDate ,adults} = state || {}; // 전달된 데이터

    const [totalPrice, setTotalPrice] = useState(0);
    const nightlyRate = 29000;

    function parseKoreanDate(koreanDate) {
        // 숫자만 추출
        const dateParts = koreanDate.match(/\d+/g); // "2024년 12월 25일" -> ["2024", "12", "25"]
        if (dateParts && dateParts.length === 3) {
            const [year, month, day] = dateParts.map(Number);
            return new Date(year, month - 1, day); // JS의 month는 0부터 시작
        }
        return null; // 잘못된 형식일 경우 null 반환
    }

    // 날짜 차이 계산 및 총 가격 계산
    useEffect(() => {
        if (checkInDate && checkOutDate) {
            // 문자열을 Date 객체로 변환
            const checkIn = parseKoreanDate(checkInDate);
            const checkOut = parseKoreanDate(checkOutDate);


            console.log("checkInDate : " + checkInDate);
            console.log("checkOutDate : " + checkOutDate);
            console.log("checkIn : " + checkIn);
            console.log("checkOut : " + checkOut);

            // 유효한 날짜인지 확인
            if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
                const diffTime = Math.abs(checkOut - checkIn);
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
                setTotalPrice(0); // 유효하지 않은 날짜인 경우
            }
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
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            title: title,
        };

        try {
            const response = await fetch("http://localhost:3001/send-reservation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reservationData),
            });

            if (response.ok) {
                alert("예약이 완료되었습니다! 이메일을 확인해주세요.");
                navigate("/"); // 예약 완료 후 메인 페이지로 이동
            } else {
                alert("예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("서버와의 통신 중 문제가 발생했습니다.");
        }
    };


    return (
        <div className="container mt-5">
            <h4 className="text-primary">숙소</h4>
            <div className="text-muted">예약 완료 후 무료 취소 가능</div>
            <h1 className="mt-3">{title}</h1>
            <p className="text-secondary">{content}</p>
            <p className="text-secondary">{checkInDate}</p>
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
                            <label className="form-label">체크인 날짜</label>
                            <input
                                type="text"
                                className="form-control"
                                name="checkinDate"
                                value={checkInDate}
                                onChange={handleChange}
                                readOnly
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">체크아웃 날짜</label>
                            <input
                                type="text"
                                className="form-control"
                                name="checkoutDate"
                                value={checkOutDate}
                                onChange={handleChange}
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
                                onChange={handleChange}
                                min="1"
                                readOnly
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">
                            예약하기
                        </button>
                    </form>
                </div>

                <div className="col-md-6">
                    <div className="card">
                        <img
                            src={img?.[0] || "https://via.placeholder.com/600x400"}
                            className="card-img-top"
                            alt={title}
                        />
                        <div className="card-body">
                            <h5 className="card-title">{title}</h5>
                            <p className="card-text">{content}</p>
                            <p className="text-muted">
                                체크인: {checkInDate || "미정"}<br/>
                                체크아웃: {checkOutDate || "미정"}
                            </p>
                            <p> 총 합계(KRW) : {totalPrice.toLocaleString()}원</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReservationForm;
