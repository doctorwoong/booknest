import {useLocation, useNavigate} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import '../CSS/style/style.css'
import { useEffect } from "react";
import { formatDate } from "../Util/utils";

const Detail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location || {};

    console.log(state);
    const { room_number, images ,adults, price ,checkInDate, checkOutDate} = state || {}; // 전달된 데이터

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
                const address = "동작구 만양로14마길 25"; // 검색할 주소
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
                        console.error("주소 검색에 실패했습니다.");
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

    const handleReservation = () => {
        const hotelData = { room_number, images ,checkInDate ,checkOutDate ,adults, price }; // 숙소 정보
        const confirmReservation = window.confirm("해당 숙소를 예약하시겠습니까?");

        if (confirmReservation) {
            navigate("/reservation-form", { state: hotelData }); // 예약 페이지로 이동하며 숙소 데이터 전달
        }
    };

    let PreCheckInDate = formatDate(checkInDate);
    let url = `/resource/img/${room_number}/`

    return (
        <div className="container">
            {state ? (
                <div>
                    {/* Carousel */}
                    <div id="carouselExample" className="carousel slide">
                        <div className="carousel-inner">
                            {images.map((image, index) => (
                                <div
                                    className={`carousel-item ${index === 0 ? "active" : ""}`}
                                    key={index}
                                >
                                    <img src={url+image} className="d-block w-100" alt={`Slide ${index + 1}`}/>
                                </div>
                            ))}
                        </div>
                        <button
                            className="carousel-control-prev"
                            type="button"
                            data-bs-target="#carouselExample"
                            data-bs-slide="prev"
                        >
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button
                            className="carousel-control-next"
                            type="button"
                            data-bs-target="#carouselExample"
                            data-bs-slide="next"
                        >
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </div>
                    {/* Hotel Info */}
                    <div>
                        <p>일반 호텔</p>
                        <h2>{room_number}</h2>
                        <p></p>
                        <p>체크인 날짜 : {PreCheckInDate}</p>
                        <b>간략한 위치 설명 / 소개</b><br/>
                        <span>인천공항에서 지하철 9호선을 이용하여 노량진역까지 오실 수 있으며 노량진역에서 걸어서 10분거리에 있습니다. 전용 욕실, 전용 주방 및 전용 세탁기가 있습니다.  숙소 가는 길에 다양한 식당, 카페, 편의점이 있는 활기찬 동네이지만 숙소는 조용합니다.</span><br/><br/>

                        <b>시설/서비스</b><br/>
                        <span> 난방, 온수, 냉장고, 세탁기, 에어컨, 인덕션, 전자레인지, 간이주방, 빨래건조대, 옷장 및 옷걸이, 다리미, 헤어 드라이어, 기본조리도구, 식기류,  바디워시, 샴푸, 컨디셔너, 수건5장, 주방세제, 세탁세제</span><br/><br/>

                        <b>이용안내</b><br/>
                        <span>최소 3박부터 예약 가능하며, 체크인은 오후2시 체크아웃은 오전11시 입니다. 조기 체크인이나 늦은 체크아웃은 기존 게스트가 있는 지 여부에 따라 가능할 수 있으며 추가 비용은 없습니다.</span><br/><br/>

                        <b>예약 알림을 받을 이메일 : </b><span>bakho2@naver.com</span><br/><br/>

                        <div
                            id="map"
                            className="map"
                            style={{
                                width: "100%",
                                height: "500px",
                            }}
                        ></div>
                    </div>
                </div>
            ) : (
                <p>선택된 호텔 정보가 없습니다.</p>
            )}
            <br/><br/>
            <div className="container-reservation">
                <button onClick={handleReservation}>예약하기</button>
            </div>
        </div>
    );
};

export default Detail;
