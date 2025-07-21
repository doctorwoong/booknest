import React, { useEffect, useState } from "react";
import "../CSS/style/style.css";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../Util/api";
import { formatDate } from "../Util/utils";
import { FaCalendarAlt, FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import channeltalk from '../resource/channeltalk.gif'

let url = "/resource/img/";

const Main = () => {
    const location = useLocation();
    let checkInDate = location.state?.checkInDate || null;
    let checkOutDate = location.state?.checkOutDate || null;
    let checkDate = "";

    const [showPopup, setShowPopup] = useState(false);
    const [inputPhone, setInputPhone] = useState("");
    const [showPasswordPopup, setShowPasswordPopup] = useState(false); // 리뷰 팝업
    const [selectedReservation, setSelectedReservation] = useState(null); // 선택된 예약 정보
    const [selectedReview, setSelectedReview] = useState(null); // 선택된 리뷰
    const [rooms, setRooms] = useState([]);
    const [checkRooms, setCheckRooms] = useState([]);
    const [reviews, setReviews] = useState([]);

    const [showContainer, setShowContainer] = useState(false);
    const [showContainer2, setShowContainer2] = useState(false);
    const [showContainer3, setShowContainer3] = useState(false);
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        startDate: checkInDate || null,
        endDate: checkOutDate || null,
        adults: 1,
    });

    const [names,setNames] = useState({name:""});

    if (!checkInDate) {
        checkDate = t("21");
    } else {
        checkDate = `${checkInDate.slice(0, 4)}`+t("22") + `${checkInDate.slice(4, 6)}`+t("23") + `${checkInDate.slice(6)}`+t("24") +
            ` ~ ${checkOutDate.slice(0, 4)}`+t("22") + `${checkOutDate.slice(4, 6)}` +t("23") + `${checkOutDate.slice(6)}`+t("24");
    }
    useEffect(() => {
        try {
            const fetchData = async () => {
                const data = await apiRequest("/review", "POST");
                if(data.length > 0){
                    setShowContainer3(true);
                }
                setReviews(data); // 상태 업데이트
            };
            fetchData();
        } catch (error) {
            console.error("검색 중 오류 발생:", error);
        }

        handleSearch();
    }, []);


    const handleSearch = async () => {
        if (filters.startDate && filters.endDate) {
            try {
                const data = await apiRequest("/MainSearch", "POST", filters);
                setRooms(data);
                if(data.length > 0) {setShowContainer(true);}
                else alert(t("154"));
            } catch (error) {
                console.error("검색 중 오류 발생:", error);
            }
        }
    };

    const handleSearch2 = async () => {
        if (names.name) {
            try {
                const data = await apiRequest("/check", "POST", names);
                if(data.length > 0) {setShowContainer2(true);}
                setCheckRooms(data); // 검색 결과를 상태에 저장
            } catch (error) {
                console.error("검색 중 오류 발생:", error);
            }
        } else {
            alert(t("26"));
        }
    };

    const navigate = useNavigate();

    const handleNavigate = (room) => {
        const extendedHotelData = {
            ...room,
            checkInDate: filters.startDate,
            checkOutDate: filters.endDate,
            adults: filters.adults,
        };
        navigate("/detail", { state: extendedHotelData });
    };

    const handleReview = (hotel) => {
        navigate("/review", { state: hotel });
    };

    const handleCalendar = () => {
        navigate("/reservation-calendar");
    };

    const handleCancelClick = (reservation) => {
        setSelectedReservation(reservation);
        setShowPopup(true);
    };

    const handleConfirm = async () => {
        if (inputPhone === selectedReservation.phone_number) {
            try {
                await apiRequest("/delete-reservation", "POST", { id: selectedReservation.customer_id });
                alert(`${selectedReservation.reserved_room_number}`+t("27"));
                setCheckRooms((prev) => prev.filter((item) => item.customer_id !== selectedReservation.customer_id));
                setShowPopup(false);
                setInputPhone("");
                setSelectedReservation(null);
            } catch (error) {
                console.error("예약 취소 중 오류 발생:", error);
                alert(t("28"));
            }
        } else {
            alert(t("29"));
        }
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setInputPhone("");
        setSelectedReservation(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
        setNames((prev) => ({
            ...prev,
            name: value, // names 상태 업데이트
        }));
    };

    const handleReviewWrite = (review) => {
        setSelectedReview(review);
        setShowPasswordPopup(true); // 리뷰 팝업 열기
    }

    const handlePasswordSubmit = () => {
        if (inputPhone !== selectedReview.phone_number) {
           alert(t("30"))
        }else{
            setShowPasswordPopup(false); // 팝업 닫기
            navigate("/reviewWrite", { state: selectedReview }); // Admin 페이지로 이동
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSearch2();
        }
    };

    const handleKeyDown2 = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleConfirm();
        }
    };

    const handleKeyDown3 = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handlePasswordSubmit();
        }
    };


    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    return (
        <>
            <br/><br/>
            <div className="channelTalk">
                <b>{t("152")}<img src={channeltalk}/></b>
            </div>
            <br/>
            <h3 style={{marginBottom: "10px"}}><b>{t("1")}</b></h3>
            <p style={{color: "#5A5A5A", marginBottom: "30px"}}>{t("2")}</p>
            <div style={{overflowY: "hidden"}}>
                <div className="d-flex gap-2" style={{marginBottom: "50px"}}>
                    {/* 날짜 선택 */}
                    <div className="position-relative">
                        <input type="text" id="startDate" name="startDate" value={checkDate} onClick={handleCalendar}
                               className="form-control ps-5" readOnly/>
                        <FaCalendarAlt className="position-absolute top-50 start-0 translate-middle-y ms-3" size={16}
                                       color="#555"/>
                    </div>

                    {/* 인원 선택 */}
                    <div className="position-relative">
                        <input type="number" id="adults" name="adults" min="1" value={filters.adults}
                               className="form-control ps-5" onChange={handleChange} readOnly/>
                        <FaUser className="position-absolute top-50 start-0 translate-middle-y ms-3" size={16}
                                color="#555"/>
                    </div>

                    {/* 검색 버튼 */}
                    <button className="reverseBtn" onClick={handleSearch}>{t("3")}</button>
                </div>
                {showContainer && (
                    <div className="container" style={{height: "45vh", overflow: "auto"}}>
                        <ul className="list-group">
                            {rooms.map((room) => (
                                <li key={room.seq} className="list-group-item d-flex align-items-center2">
                                    <img
                                        src={`${url}/${room.room_number}/${room.images[0]}`}
                                        alt={`Hotel ${room.room_number}`}
                                        className="img-thumbnail me-3"
                                        style={{width: "180px", height: "120px", objectFit: "cover"}}
                                        onClick={() => handleNavigate(room)}
                                    />
                                    <div className="container-main">
                                        <h5 className="mb-1">{room.room_number}</h5>
                                        <p className="mb-1"></p>
                                        <p className="mb-1" style={{color: "#5A5A5A"}}>
                                            ★ {room.rating}
                                            <span style={{cursor: "pointer"}}
                                                  onClick={() => handleReview(room)}>({room.reviewNum})
                                        </span>
                                        </p>
                                        <p className="mb-0">
                                            <span>{t("4")}</span><br/>
                                            <b>{room.price}{t("5")}~</b>
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <hr className="footer-divider"/>
            <h3 style={{marginBottom: "10px", marginTop: "50px"}}><b>{t("6")}</b></h3>
            <p style={{color: "#5A5A5A", marginBottom: "30px"}}>{t("7")}</p>
            <div className="reservationCheck" style={{marginBottom: "50px"}}>
                <div className="col-md-10">
                    <input type="text" className="form-control" id="name" name="name" placeholder={t("8")}
                           onKeyDown={handleKeyDown}
                           value={names.name} onChange={handleChange}/>
                </div>
                <div className="col-md-2">
                    <button className="reverseBtn" onClick={handleSearch2}>{t("3")}</button>
                </div>
            </div>
            {showContainer2 && (
                <div style={{overflowY: "hidden", height: "22vh"}}>
                    <div className="container" style={{height: "100%", overflow: "auto"}}>
                        <ul className="list-group">
                            {checkRooms.map((checkRoom) => (
                                <li key={checkRoom.customer_id} className="list-group-item d-flex align-items-center">
                                    <div className="reservation">
                                        <h5 className="horse">{checkRoom.reserved_room_number}{t("9")}</h5>
                                        <p>
                                            <span>{t("10")} : </span>
                                            <span>{formatDate(checkRoom.check_in)}</span> ~ <span>{formatDate(checkRoom.check_out)}</span>
                                        </p>
                                    </div>
                                    <div className="reservation2">
                                        <input type={"button"} value={t("11")}
                                               onClick={() => handleCancelClick(checkRoom)}/>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            )}
            {showPopup && (
                <div className="password-popup">
                    <div className="popup-content">
                        <h4>{t("12")}</h4>
                        <input
                            type="text"
                            placeholder={t("13")}
                            value={inputPhone}
                            onKeyDown={handleKeyDown2}
                            onChange={(e) => setInputPhone(e.target.value)}
                        />
                        <div className="checkBtn">
                            <button className="btn btn-danger" onClick={handleConfirm}>{t("14")}</button>
                            <button className="btn btn-secondary" onClick={handleClosePopup}>{t("15")}</button>
                        </div>
                    </div>
                </div>
            )}
            <hr className="footer-divider"/>
            <h3 style={{marginBottom: "10px", marginTop: "50px"}}><b>{t("16")}</b></h3>
            <p style={{color: "#5A5A5A", marginBottom: "30px"}}>{t("17")}</p>

            <div style={{overflowY: "hidden", marginBottom: "50px"}}>
                {showContainer3 && (
                    <div className="container" style={{height: "35vh", overflow: "auto"}}>
                        <ul className="list-group">
                            {reviews.map((review) => (
                                <li key={review.customer_id} className="list-group-item d-flex align-items-center">
                                    <div className="reservation">
                                        <h5 className="horse">{review.reserved_room_number}{t("9")}</h5>
                                        <p>
                                            <span>{formatDate(review.check_in)}</span> ~ <span>{formatDate(review.check_out)}</span>
                                        </p>
                                    </div>
                                    <div className="reservation2">
                                        <input type={"button"} value={t("18")}
                                               onClick={() => handleReviewWrite(review)}/>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {showPasswordPopup && (
                    <div className="password-popup">
                        <div className="popup-content">
                            <h3>{t("19")}</h3>
                            <p>{t("20")}</p>
                            <input
                                type="text"
                                value={inputPhone}
                                onKeyDown={handleKeyDown3}
                                onChange={(e) => setInputPhone(e.target.value)}
                                placeholder={t("13")}
                            />
                            <div className="checkBtn">
                                <button onClick={handlePasswordSubmit}>{t("14")}</button>
                                <button onClick={() => setShowPasswordPopup(false)}>{t("15")}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Main;
