import React, { useEffect, useState } from "react";
import "../CSS/style/style.css";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../Util/api";
import { formatDate } from "../Util/utils";

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

    const [filters, setFilters] = useState({
        startDate: checkInDate || null,
        endDate: checkOutDate || null,
        adults: 1,
    });

    const [names,setNames] = useState({name:""});

    if (!checkInDate) {
        checkDate = "날짜 선택";
    } else {
        checkDate = `${checkInDate.slice(0, 4)}년 ${checkInDate.slice(4, 6)}월 ${checkInDate.slice(6)}일 ~ ` +
            `${checkOutDate.slice(0, 4)}년 ${checkOutDate.slice(4, 6)}월 ${checkOutDate.slice(6)}일`;
    }
    useEffect(() => {
        console.log("###리뷰데이터 조회###");
        try {
            const fetchData = async () => {
                const data = await apiRequest("/review", "POST");
                console.log("검색 결과:", data);
                setReviews(data); // 상태 업데이트
            };
            fetchData();
        } catch (error) {
            console.error("검색 중 오류 발생:", error);
        }
    }, []);


    const handleSearch = async () => {
        console.log("필터 데이터 : ", JSON.stringify(filters));

        if (filters.startDate && filters.endDate) {
            try {
                const data = await apiRequest("/MainSearch", "POST", filters);
                console.log("검색 결과:", data);
                setRooms(data); // 검색 결과를 상태에 저장
            } catch (error) {
                console.error("검색 중 오류 발생:", error);
            }
        } else {
            alert("날짜를 입력해주세요.");
        }
    };

    const handleSearch2 = async () => {
        console.log("필터 데이터 : ", JSON.stringify(names));

        if (names.name) {
            try {
                const data = await apiRequest("/check", "POST", names);
                console.log("검색 결과:", data);
                setCheckRooms(data); // 검색 결과를 상태에 저장
            } catch (error) {
                console.error("검색 중 오류 발생:", error);
            }
        } else {
            alert("이름을 입력해주세요.");
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
        console.log("입력한 전화번호: " + inputPhone);
        console.log("세팅 전화번호: " + selectedReservation.phone_number);
        if (inputPhone === selectedReservation.phone_number) {
            try {
                await apiRequest("/delete-reservation", "POST", { id: selectedReservation.customer_id });
                alert(`"${selectedReservation.reserved_room_number}" 예약이 취소되었습니다.`);
                setCheckRooms((prev) => prev.filter((item) => item.customer_id !== selectedReservation.customer_id));
                setShowPopup(false);
                setInputPhone("");
                setSelectedReservation(null);
            } catch (error) {
                console.error("예약 취소 중 오류 발생:", error);
                alert("예약 취소 중 오류가 발생했습니다.");
            }
        } else {
            alert("입력한 전화번호가 예약 정보와 일치하지 않습니다.");
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
        console.log("후기 작성하기 버튼 클릭");

        setSelectedReview(review);
        setShowPasswordPopup(true); // 리뷰 팝업 열기
    }

    const handlePasswordSubmit = () => {
        if (inputPhone !== selectedReview.phone_number) {
           alert("본인 인증에 실패하였습니다.")
        }else{
            setShowPasswordPopup(false); // 팝업 닫기
            navigate("/reviewWrite", { state: selectedReview }); // Admin 페이지로 이동
        }
    };


    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const formattedToday = today.toISOString().split('T')[0].replace(/-/g, '');
    const formattedSevenDaysAgo = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '');
    const formattedDate = `${formattedSevenDaysAgo}~${formattedToday}`;

    return (
        <>
            <h3>숙박 예약(최소 숙박 3일)</h3>
            <div style={{overflowY: "scroll", height: "45vh"}}>
                <div className="row align-items-center">
                    <div className="col-md-6 mb-2">
                        <label htmlFor="startDate">예약일</label>
                        <input type="text" className="form-control" id="startDate" name="startDate" value={checkDate}
                               onClick={handleCalendar} readOnly/>
                    </div>
                    <div className="col-md-2 mb-2">
                        <label htmlFor="adults">성인</label>
                        <input type="number" className="form-control" id="adults" name="adults" min="1"
                               value={filters.adults} onChange={handleChange}/>
                    </div>
                    <div className="col-md-2 mb-2">
                        <button className="btn btn-primary mt-3" onClick={handleSearch}>검색</button>
                    </div>
                </div>

                <div className="container" style={{height: "100%", overflow: "auto"}}>
                    <ul className="list-group">
                        {rooms.map((room) => (
                            <li key={room.seq} className="list-group-item d-flex align-items-center">
                                <img
                                    src={`${url}/${room.room_number}/${room.images[0]}`}
                                    alt={`Hotel ${room.room_number}`}
                                    className="img-thumbnail me-3"
                                    style={{width: "150px", height: "100px", objectFit: "cover"}}
                                    onClick={() => handleNavigate(room)}
                                />
                                <div>
                                    <h5 className="mb-1">{room.room_number}</h5>
                                    <p className="mb-1"></p>
                                    <p className="mb-1">
                                        ★ {room.rating} <button style={{cursor: "pointer"}}
                                                              onClick={() => handleReview(room)}>({room.reviewNum} 리뷰)</button>
                                    </p>
                                    <p className="mb-0"><strong>1박 기준: {room.price} ~</strong></p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <h3>예약확인</h3>
            <div className="row align-items-center">
                <div className="col-md-10 mb-10">
                    <label htmlFor="name">이름</label>
                    <input type="text" className="form-control" id="name" name="name"
                           value={names.name} onChange={handleChange}/>
                </div>
                <div className="col-md-2 mb-2">
                    <button className="btn btn-primary mt-3" onClick={handleSearch2}>검색</button>
                </div>
            </div>
            <div style={{overflowY: "scroll", height: "15vh"}}>
                <div className="container" style={{height: "100%", overflow: "auto"}}>
                    <ul className="list-group">
                        {checkRooms.map((checkRoom) => (
                            <li key={checkRoom.customer_id} className="list-group-item d-flex align-items-center">
                                <div>
                                    <h5 className="mb-1">{checkRoom.reserved_room_number}호</h5><span>{checkRoom.name}</span>
                                    <p>
                                        <span>예약일 : </span>
                                        <span>{formatDate(checkRoom.check_in)}</span> ~ <span>{formatDate(checkRoom.check_out)}</span>
                                    </p>
                                </div>
                                <br/>
                                <div>
                                    <input type={"button"} value={"예약취소"} onClick={() => handleCancelClick(checkRoom)}/>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {showPopup && (
                <div className="password-popup">
                    <div className="popup-content">
                        <h4>전화번호 확인</h4>
                        <input
                            type="text"
                            placeholder="전화번호 입력('-'뺴고 입력해주세요.)"
                            value={inputPhone}
                            onChange={(e) => setInputPhone(e.target.value)}
                        />
                        <button className="btn btn-danger" onClick={handleConfirm}>확인</button>
                        <button className="btn btn-secondary" onClick={handleClosePopup}>취소</button>
                    </div>
                </div>
            )}

            <h3>리뷰 작성({formattedDate})</h3>
            <div style={{overflowY: "scroll", height: "35vh"}}>
                <div className="container" style={{height: "100%", overflow: "auto"}}>
                    <ul className="list-group">
                        {reviews.map((review) => (
                            <li key={review.customer_id} className="list-group-item d-flex align-items-center">
                                <div>
                                    <h4>{review.name}</h4>
                                    <h5 className="mb-1">{review.reserved_room_number}호</h5>
                                    <p>
                                        <span>{formatDate(review.check_in)}</span> ~ <span>{formatDate(review.check_out)}</span>
                                    </p>
                                </div>
                                <br/>
                                <div>
                                    <input type={"button"} value={"후기 작성하기"} onClick={() => handleReviewWrite(review)}/>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {showPasswordPopup && (
                    <div className="password-popup">
                        <div className="popup-content">
                            <h3>본인 전화번호 입력</h3>
                            <p>본인 확인을 위해 전화번호 입력은 필수 입니다.</p>
                            <input
                                type="text"
                                value={inputPhone}
                                onChange={(e) => setInputPhone(e.target.value)}
                                placeholder="전화번호 입력('-'뺴고 입력해주세요.)"
                            />
                            <button onClick={handlePasswordSubmit}>확인</button>
                            <button onClick={() => setShowPasswordPopup(false)}>취소</button>

                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Main;
