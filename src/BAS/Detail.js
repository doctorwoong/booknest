import {useLocation, useNavigate} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import '../CSS/style/style.css'
import React, {useEffect, useState} from "react";
import { formatDate } from "../Util/utils";
import {apiRequest} from "../Util/api";
import pro from "../resource/profil.jpeg";
import {useTranslation} from "react-i18next";

const Detail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location || {};
    const { t } = useTranslation();

    console.log(state);
    const { room_number, images ,adults, price ,checkInDate, checkOutDate} = state || {}; // 전달된 데이터
    const nightlyRate = price;
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reviews, setReviews] = useState([]); // 리뷰 데이터 상태 관리

    const openModal = (index) => {
        setSelectedImage(url + images[index]);
        setCurrentIndex(index);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const nextImage = () => {
        const newIndex = (currentIndex + 1) % images.length;
        setSelectedImage(url + images[newIndex]);
        setCurrentIndex(newIndex);
    };

    const prevImage = () => {
        const newIndex = (currentIndex - 1 + images.length) % images.length;
        setSelectedImage(url + images[newIndex]);
        setCurrentIndex(newIndex);
    };

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
            if (diffDays >= 30) {
                discount = 0.3; // 30% 할인
            } else if (diffDays >= 8) {
                discount = 0.15; // 15% 할인
            }

            const calculatedPrice = diffDays * nightlyRate * (1 - discount);
            setTotalPrice(calculatedPrice);
        } else {
            setTotalPrice(0);
        }
    }, [checkInDate, checkOutDate]);

    const fetchReviews = async (roomNumber) => {
        try {
            const response = await apiRequest(`/api/reviews/${roomNumber}`, "GET");
            setReviews(response);

        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        }
    };

    // 컴포넌트가 로드될 때 방 번호로 리뷰 데이터 가져오기
    useEffect(() => {
        if (room_number) {
            fetchReviews(room_number);
        }
    }, [room_number]);

    const handleReservation = () => {
        const hotelData = { room_number, images ,checkInDate ,checkOutDate ,adults, price };
        const confirmReservation = window.confirm(t("33"));

        if (confirmReservation) {
            navigate("/reservation-form", { state: hotelData });
        }
    };

    let url = `/resource/img/${room_number}/`

    return (
        <div className="container">
            {state ? (
                <div>
                    <br/><br/>
                    <h2><b>{room_number}호</b></h2>
                    <p style={{color: "#5A5A5A"}}>{t("34")}</p>
                    <div className="container mt-4">
                        <div className="row g-2">
                            <div className="col-md-8">
                                <img
                                    src={url + images[0]}
                                    className="img-fluid rounded shadow"
                                    alt="Main Image"
                                    style={{cursor: "pointer", objectFit: "cover", width: "100%", height: "400px"}}
                                    onClick={() => openModal(0)}
                                />
                            </div>
                            <div className="col-md-4 d-flex flex-column gap-2">
                                {images.slice(1, 3).map((image, index) => (
                                    <img
                                        key={index}
                                        src={url + image}
                                        className="img-fluid rounded shadow"
                                        alt={`Small Image ${index + 1}`}
                                        style={{cursor: "pointer", objectFit: "cover", height: "195px"}}
                                        onClick={() => openModal(index + 1)}
                                    />
                                ))}
                            </div>
                        </div>
                        <br/>
                        {/* 모달 (팝업) */}
                        {selectedImage && (
                            <div className="modal show d-block" style={{background: "rgba(0, 0, 0, 0.8)"}}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content bg-transparent border-0">
                                        <div className="modal-body text-center position-relative" style={{padding:"0"}}>
                                            {/* 닫기 버튼 */}
                                            <button className="btn-close position-absolute top-0 end-0 m-2"
                                                    onClick={closeModal}></button>

                                            {/* 팝업 이미지 */}
                                            <img src={selectedImage} className="img-fluid rounded shadow-lg"
                                                 alt="Selected"/>

                                            {/* 이전 / 다음 버튼 */}
                                            <button
                                                className="btn btn-dark position-absolute start-0 top-50 translate-middle-y"
                                                onClick={prevImage}>
                                                ◀
                                            </button>
                                            <button
                                                className="btn btn-dark position-absolute end-0 top-50 translate-middle-y"
                                                onClick={nextImage}>
                                                ▶
                                            </button>

                                            {/* 썸네일 리스트 */}
                                            <div className="d-flex justify-content-center mt-3">
                                                {images.map((image, index) => (
                                                    <img
                                                        key={index}
                                                        src={url + image}
                                                        className={`img-thumbnail mx-1 ${index === currentIndex ? "border border-warning" : ""}`}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        style={{width: "50px", cursor: "pointer"}}
                                                        onClick={() => openModal(index)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Hotel Info */}
                    <hr/><br/>
                    <div>
                        <h4><b>{t("35")}</b></h4>
                        <span>{t("36")}</span><br/><br/><br/>

                        <h4><b>{t("37")}</b></h4>
                        <span>{t("38")}</span><br/><br/><br/>

                        <h4><b>{t("39")}</b></h4>
                        <span>{t("40")}</span><br/><br/><br/>

                        <h4><b>{t("41")}</b></h4>
                        <div id="map" className="map" style={{width: "100%", height: "500px"}}></div><br/>

                        {/* 가격 및 예약 버튼 */}
                        <div className="border p-3 mt-3">
                            <div className="reserCost">
                                <h4><b>₩{price.toLocaleString()}</b><span>/ {t("42")}</span></h4>
                                <div className="reserCost-container">
                                    <span id="costCheck">{t("43")}</span><br/><span
                                    id="costCheck2">{formatDate(checkInDate)}</span>
                                </div>
                                <div>
                                    <span id="costCheck">{t("44")}</span><br/><span
                                    id="costCheck2">{formatDate(checkOutDate)}</span>
                                </div>
                            </div>
                            <hr className="footer-divider"/>
                            <div className="reserCost2">
                                <span>{t("45")}</span><br/>
                                <span>{t("46")}</span>
                            </div>
                            <hr className="footer-divider"/>
                            <div className="reserCost3">
                                <span>{t("47")}</span>
                                <h2>₩{totalPrice.toLocaleString()}</h2>
                            </div>

                            <button className="revers" onClick={handleReservation}>{t("48")}</button>
                        </div>
                    </div>
                    <br/>

                    <div>
                        <h4><b>{t("49")}</b></h4>
                        <div style={{overflowY: "scroll", height: "30vh"}}>
                            <div className="container" style={{height: "100%", overflow: "auto"}}>
                                <ul className="list-group">
                                    {reviews.map((review) => (
                                        <li key={review.review_id}
                                            className="list-group-item d-flex align-items-center" style={{height:"auto"}}>
                                            <div style={{paddingRight: "30px"}}>
                                                <img src={pro} alt="Teamtoys Logo"
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
