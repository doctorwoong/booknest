import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import '../CSS/style/style.css';
import { formatDate } from "../Util/utils";
import { apiRequest } from "../Util/api";
import { useTranslation } from "react-i18next";

const Detail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location || {};
    const { t } = useTranslation();
    const { room_number, images, price, checkInDate, checkOutDate } = state || {};
    const nightlyRate = price;
    const [totalPrice, setTotalPrice] = useState(0);
    const [reviews, setReviews] = useState([]);

    let url = `/resource/img/${room_number}/`;
    const [isLoading, setIsLoading] = useState(false); 

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

    useEffect(() => {
        // Kakao 지도 API 스크립트 로드
        const script = document.createElement("script");
        script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=04ad74e0900c6882ee7b6466c6cc258b&libraries=services&autoload=false"; // local
        script.async = true;

        // 스크립트 로드 완료 후 Kakao 지도 초기화
        script.onload = () => {
            // Kakao 지도 객체 초기화
            window.kakao.maps.load(() => {
                const container = document.getElementById("map"); // 지도를 표시할 div
                const options = {
                    center: new window.kakao.maps.LatLng(33.450701, 126.570667), // 중심 좌표
                    level: 4, // 확대 레벨
                };

                const map = new window.kakao.maps.Map(container, options); // 지도 생성

                // 주소 검색 객체 생성
                const geocoder = new window.kakao.maps.services.Geocoder();

                // 특정 주소를 좌표로 변환
                const address = t("31"); // 검색할 주소
                geocoder.addressSearch(address, (result, status) => {
                    if (status === window.kakao.maps.services.Status.OK) {
                        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

                        // 지도 중심 이동
                        map.setCenter(coords);

                        // 마커 생성
                        const marker = new window.kakao.maps.Marker({
                            position: coords,
                            map: map,
                        });

                    } else {
                        console.error(t("32"));
                    }
                });
            });
        };

        document.head.appendChild(script);

        return () => {
            // 컴포넌트 언마운트 시 스크립트 제거
            document.head.removeChild(script);
        };
    }, []);

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
            if (diffDays >= 30) discount = 0.3;
            else if (diffDays >= 8) discount = 0.15;

            const calculatedPrice = diffDays * nightlyRate * (1 - discount);
            setTotalPrice(calculatedPrice);
        }
    }, [checkInDate, checkOutDate]);

    useEffect(() => {
        const fetchReviews = async (roomNumber) => {
            try {
                const response = await apiRequest(`/api/reviews/${roomNumber}`, "GET");
                setReviews(response);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
            }
        };

        if (room_number) fetchReviews(room_number);
    }, [room_number]);

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
                // ✅ 여기 추가
                const message = `[노량진 스튜디오] ${formData.name}님이 예약하셨습니다.\n체크인: ${formatDate(checkInDate)}, 체크아웃: ${formatDate(checkOutDate)} 입니다.`;

                const recipients = ["01082227855", "01062776765"];

                // 번호 배열을 돌면서 문자 보내기
                for (const phone of recipients) {
                    await apiRequest("/send-check-in-sms", "POST", {
                        phone: phone,
                        message: message,
                    });
                }

                alert(t("66"));
                navigate("/");
            } else {
                alert(t("67"));
                navigate("/");
            }
        } catch (error) {
            console.error("Error:", error);
            navigate("/");
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    return (
        <div className="container">
            {state ? (
                <div>
                    <br/><br/>
                    <h2><b>{room_number}호</b></h2>
                    <p style={{color: "#5A5A5A"}}>{t("34")}</p>

                    <div id="carouselImages" className="carousel slide mt-4" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            {images.map((image, index) => (
                                <div
                                    className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                                    <img
                                        src={url + image}
                                        className="d-block w-100 rounded shadow"
                                        alt={`Slide ${index}`}
                                        style={{objectFit: "cover"}}
                                    />
                                </div>
                            ))}
                        </div>
                        <button className="carousel-control-prev" type="button" data-bs-target="#carouselImages"
                                data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#carouselImages"
                                data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </div>

                    {/* 예약 및 상세 정보 */}
                    <hr/>
                    <br/>
                    <h4><b>{t("35")}</b></h4>
                    <span>{t("36")}</span><br/><br/><br/>

                    <h4><b>{t("37")}</b></h4>
                    <span>{t("38")}</span><br/><br/><br/>

                    <h4><b>{t("39")}</b></h4>
                    <span>{t("40")}</span><br/><br/><br/>

                    <h4><b>{t("41")}</b></h4>
                    <div id="map" className="map" style={{width: "100%"}}></div>
                    <br/>

                    <div className="border p-3 mt-3">
                        <div className="reserCost">
                            <h4><b>₩{price.toLocaleString()}</b><span>/ {t("42")}</span></h4>
                            <div className="reserCost-inner">
                                <div className="reserCost-container">
                                    <span id="costCheck">{t("43")}</span><br/>
                                    <span id="costCheck2">{formatDate(checkInDate)}</span>
                                </div>
                                <div className="reserCost-container2">
                                    <span id="costCheck">{t("44")}</span><br/>
                                    <span id="costCheck2">{formatDate(checkOutDate)}</span>
                                </div>
                            </div>
                        </div>
                        <hr className="footer-divider"/>
                        <div className="reserCost2">
                            <span>• {t("45")}</span><br/>
                            <span>• {t("46")}</span><br/>
                            <span>• {t("74")}</span><br/>
                            <span>• {t("151")}</span>
                        </div>
                        <hr className="footer-divider"/>
                        <div className="reserCost3">
                            <span>{t("47")}</span>
                            <h2>₩{totalPrice.toLocaleString()}</h2>
                        </div>
                        {/*<button className="revers" onClick={handleReservation}>{t("48")}</button>*/}
                    </div>
                    <br/>
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
                                        <input type="text" className="form-control" name="passport"
                                               value={formData.passport}
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

                    <div>
                        <h4><b>{t("49")}</b></h4>
                        <div style={{overflowY: "hidden", height: "30vh"}}>
                            <div className="container" style={{height: "100%", overflow: "auto"}}>
                                <ul className="list-group">
                                    {reviews.map((review) => (
                                        <li key={review.review_id} className="list-group-item d-flex align-items-center"
                                            style={{height: "auto"}}>
                                            <div style={{paddingRight: "30px"}} className="reviewContainer">
                                                <img alt="Teamtoys Logo"
                                                     style={{width: "100px", height: "100px"}}/>
                                            </div>
                                            <div>
                                                <b className="mb-1"
                                                   style={{fontSize: "20px"}}>{review.customer_name || t("50")}</b>
                                                <p className="mb-1"><span id="stars">★</span> {review.rating}</p>
                                                <p className="mb-1">{review.review_text}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <p>{t("51")}</p>
            )}
            <br/><br/>
        </div>
    );
};

export default Detail;
