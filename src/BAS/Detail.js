import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import '../CSS/style/style.css';
import {formatDate} from "../Util/utils";
import {apiRequest} from "../Util/api";
import {useTranslation} from "react-i18next";
import PayPalCheckout from '../COMPONENT/PayPalCheckout';
import reviewlogo from '../resource/Teamtoys.png';

const Detail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {state} = location || {};
    const {t} = useTranslation();
    const {room_number, images, price, checkInDate, checkOutDate} = state || {};
    const nightlyRate = price;
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalPrice2, setTotalPrice2] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [showPayPal, setShowPayPal] = useState(false);
    const [paymentType, setPaymentType] = useState("");


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
        countryCode: "+82",
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
            const calculatedPrice2 = diffDays * 30000 * (1 - discount);
            setTotalPrice(calculatedPrice);
            setTotalPrice2(calculatedPrice2);
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

    const handleSubmit = async (e ,type) => {
        e.preventDefault();

        const reservationData = {
            name: formData.name,
            phone: `${formData.countryCode}${formData.phone}`,
            email: formData.email,
            passport: formData.passport,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            title: room_number,
            price: totalPrice,
            type: type,
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
        const {name, value} = e.target;
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
                            <span>• {t("151")}</span><br/>
                            <span>• {t("153")}</span><br/>
                            <span>• {t("155")}</span><br/>
                            <span>• {t("156")}</span><br/>
                        </div>
                        <hr className="footer-divider"/>
                        <div className="reserCost3">
                            <span>{t("47")}</span>
                            <div>
                                <h3>{t("157")} : ₩{totalPrice2.toLocaleString()}</h3>
                                <h3>{t("158")} : ₩{totalPrice.toLocaleString()}</h3>
                            </div>
                        </div>
                        {/*<button className="revers" onClick={handleReservation}>{t("48")}</button>*/}
                    </div>
                    <br/>
                    <div className="row">
                        <div className="col-md-12">
                            <h3><b>{t("78")}</b></h3>
                            <form>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t("79")}</label>
                                        <input type="text" className="form-control" name="name" value={formData.name}
                                               onChange={handleChange} placeholder={t("80")} required/>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t("81")}</label>
                                        <div className="phone-input-group">
                                            <select
                                                className="form-select country-code"
                                                value={formData.countryCode}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    countryCode: e.target.value
                                                })}
                                            >
                                                <option value="+82">+82</option>
                                                <option value="+34">+34</option>
                                                <option value="+86">+86</option>
                                                <option value="+81">+81</option>
                                                <option value="+33">+33</option>
                                                <option value="+49">+49</option>
                                                <option value="+63">+63</option>
                                                <option value="+60">+60</option>
                                                <option value="+1">+1</option>
                                                <option value="+84">+84</option>
                                                <option value="+66">+66</option>
                                                <option value="+46">+46</option>
                                                <option value="+39">+39</option>
                                                <option value="+61">+61</option>
                                            </select>
                                            <input
                                                type="tel"
                                                className="form-control phone-number"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder={t("82")}
                                                required
                                            />
                                        </div>
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
                                {/*<button*/}
                                {/*    type="button"*/}
                                {/*    className="reverseBtn2"*/}
                                {/*    onClick={() => {*/}
                                {/*        if (!formData.name || !formData.phone || !formData.email) {*/}
                                {/*            alert("예약자 정보를 모두 입력해주세요.");*/}
                                {/*            return;*/}
                                {/*        }*/}

                                {/*        if (formData.countryCode === "+82") {*/}
                                {/*            if(window.confirm('해당 숙소로 예약하시겠습니까?')) {*/}
                                {/*                handleSubmit(new Event("submit"));*/}
                                {/*            }*/}
                                {/*        } else {*/}
                                {/*            setShowPayPal(true);*/}
                                {/*        }*/}
                                {/*    }}*/}
                                {/*    disabled={isLoading}*/}
                                {/*>*/}
                                {/*    {isLoading ? t("87") + "..." : t("88")}*/}
                                {/*</button>*/}
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="reverseBtn2"
                                        onClick={(e) => {
                                            if (!formData.name || !formData.phone || !formData.email) {
                                                alert(t("59"));
                                                return;
                                            }

                                            if (window.confirm(t("33"))) {
                                                handleSubmit(e, "cash");  // 직접 전달
                                            }
                                        }}
                                        disabled={isLoading}
                                    >
                                        💵 {t("157")}
                                    </button>


                                    <button
                                        type="button"
                                        className="reverseBtn2"
                                        onClick={() => {
                                            if (!formData.name || !formData.phone || !formData.email) {
                                                alert(t("59"));
                                                return;
                                            }
                                            if(formData.countryCode === "+82") {
                                                alert(t("한국 발행카드는 카드결재가 불가하니 체크인시 현금 결재 바랍니다."));
                                                return;
                                            }
                                            setPaymentType("card");
                                            setShowPayPal(true);

                                        }}
                                        disabled={isLoading}
                                    >
                                        💳 {t("158")}
                                    </button>
                                </div>


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
                                        <li key={review.review_id} className="list-group-item2" style={{height: "auto"}}>

                                            <div className="d-flex align-items-center mb-2">
                                                <div style={{paddingRight: "20px"}}>
                                                    <img
                                                        alt="Teamtoys Logo"
                                                        src={reviewlogo}
                                                        style={{width: "50px", height: "50px", borderRadius: "50%"}}
                                                    />
                                                </div>
                                                <div>
                                                    <b style={{fontSize: "18px"}}>{review.customer_name || t("50")}</b>
                                                    <div style={{fontSize: "16px"}}>
                                                        <span id="stars">★</span> {review.rating}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-1" style={{whiteSpace: "pre-line"}}>
                                                    {review.review_text}
                                                </p>
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
            {/* PayPal 버튼 클릭 후 모달 열기 */}
            {showPayPal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">PayPal 결제</h5>
                                <button type="button" className="btn-close"
                                        onClick={() => setShowPayPal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <PayPalCheckout
                                    amount={totalPrice}
                                    onApprove={async (details) => {
                                        const reservationData = {
                                            name: formData.name,
                                            phone: `${formData.countryCode}${formData.phone}`,
                                            email: formData.email,
                                            passport: formData.passport,
                                            checkInDate: checkInDate,
                                            checkOutDate: checkOutDate,
                                            title: room_number,
                                            price: totalPrice,
                                            type: "card",
                                        };

                                        try {
                                            setIsLoading(true);
                                            const insertResponse = await apiRequest("/insertReservation", "POST", reservationData);

                                            if (insertResponse) {
                                                alert(t("66"));
                                                navigate("/");
                                            } else {
                                                alert(t("67"));
                                            }
                                        } catch (e) {
                                            console.error("예약 실패:", e);
                                            alert("예약 중 문제가 발생했습니다.");
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                /></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Detail;
