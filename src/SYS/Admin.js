import React, { useEffect, useState } from "react";
import { apiRequest } from "../Util/api";
import "../CSS/style/admin.css";
import { formatDate } from "../Util/utils";
import {useTranslation} from "react-i18next";
import 'bootstrap/dist/css/bootstrap.min.css';
import CalendarTab from "./CalendarTab";
import Spinner from 'react-bootstrap/Spinner';


function Admin() {
    const [activeTab, setActiveTab] = useState("customer");
    const [reservationCustomers, setreservationCustomers] = useState([]);
    const [checkInCustomers, setCheckInCustomers] = useState([]);
    const [checkOutCustomers, setCheckOutCustomers] = useState([]);
    const { t } = useTranslation();

    const [showModal, setShowModal] = useState(false);
    const [smsContent, setSmsContent] = useState("");  // 수정 가능한 메시지
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [smsType, setSmsType] = useState(""); // checkIn2 / checkOut2

    const [bookings ,setBookings] = useState([]);
    const [airbookings ,setAirbookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const rooms = [
        {id : 1, name: 'C106'},
        {id : 2, name: 'C107'},
        {id : 3, name: 'C201'},
        {id : 4, name: 'C302'},
        {id : 5, name: 'C305'},
        {id : 6, name: 'C402'},
        {id : 8, name: 'N103'},
        {id : 9, name: 'N202'},
        {id : 10, name: 'R102'},
        {id : 11, name: 'N303'},
        {id : 12, name: 'N306'},
        {id : 13, name: 'N307'},
        {id : 14, name: 'N203'},
        {id : 15, name: 'N207'},
    ];

    const isWithinAWeek = (dateString) => {
        const today = new Date();
        const targetDate = new Date(dateString);
        const diffTime = Math.abs(today - targetDate);
        return diffTime <= 7 * 24 * 60 * 60 * 1000; // 7일 이내
    };

    const isWithinAWeek2 = (dateString) => {
        const today = new Date();
        const targetDate = new Date(dateString);
        today.setHours(0, 0, 0, 0);
        const twoDaysAfterToday = new Date(today);
        twoDaysAfterToday.setDate(today.getDate() + 2);

        return targetDate >= today && targetDate <= twoDaysAfterToday;
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                if (activeTab === "checkIn") {
                    const data = await apiRequest("/check-in","POST");

                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkIn: formatDate(customer.checkIn), // 날짜 형식 변환
                    }));

                    setCheckInCustomers(formattedData);
                } else if (activeTab === "checkOut") {
                    const data = await apiRequest("/check-out","POST");
                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkOut: formatDate(customer.checkOut), // 날짜 형식 변환
                    }));
                    setCheckOutCustomers(formattedData);
                }else if (activeTab === "calendar") {
                    const data = await apiRequest("/calendar_admin","POST");
                    const formattedData = data.map((customer) => ({
                        ...customer,
                    }));
                    setBookings(formattedData);

                    const data2 = await apiRequest("/calendar_airbnb","POST");
                    const formattedData2 = data2.map((customer) => ({
                        ...customer,
                    }));
                    setAirbookings(formattedData2);
                }else{
                    const data = await apiRequest("/getReservation","POST");

                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkIn: formatDate(customer.checkInDate),
                        checkOut: formatDate(customer.checkOutDate),
                    }));

                    setreservationCustomers(formattedData);
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
            }finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleSendEmail = async (customer, type) => {
        if (!window.confirm("메일을 보내시겠습니까?")) return;
        let endpoint = "";
        let mailpoint = "";
        let statusKey = "";

        if(type === "checkIn"){
            endpoint = "/send-check-in-email";
            mailpoint = "/updateCheckInMailStatus";
            statusKey = "check_in_mail_status";
        }else if(type === "reservation"){
            endpoint = "/send-reservation";
            mailpoint = "/updateReservationMailStatus";
            statusKey = "reservation_mail_status";
        }

        try {
            setLoading(true);
            const [sendResponse, updateResponse] = await Promise.all([
                apiRequest(endpoint, "POST", customer),
                apiRequest(mailpoint, "POST", customer)
            ]);

            if (sendResponse && updateResponse) {
                // ✅ 상태값 변경하여 UI 업데이트
                if (type === "checkIn") {
                    setCheckInCustomers(prev =>
                        prev.map(c => c.id === customer.id ? { ...c, [statusKey]: "Y" } : c)
                    );
                } else if (type === "reservation") {
                    setreservationCustomers(prev =>
                        prev.map(c => c.customer_id === customer.customer_id ? { ...c, [statusKey]: "Y" } : c)
                    );
                }
            } else {
                alert(t("117"));
            }

        } catch (error) {
            alert(t("118")+`: ${customer.name}`);
        }finally {
            setLoading(false);
        }
    };

    const handleOpenSMSModal = (customer, type) => {
        let message = ""; // 여기에 기본 message 생성 로직 재사용

        // 간단하게 예시:
        if (type === "checkOut2") {
            message = `Good morning.
            \nI hope you have stayed without any inconvenience. I would like you to post a review about your studio in the website(https://airbnbnoryangjin.co.kr/) if it is not bothering you.
            \nHave a wonderful day.
            \nCleaning your room will be started 11am. Please check out at 11am or a little earlier.`;

        } else {
            switch (customer.room) {
                case "R102":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 102 and the door lock password is 12388*. 
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime102 and the password is '12318102'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "N103":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 103 and the door lock password is 11038*. 
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime103 and the password is '11038103h'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "K105":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 105 and the door lock password is 12358*. 
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime7855-5G or iptime7855, and the password is 'korea7855'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "C106":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 106 and the door lock password is 10618*. 
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime106, and the password is '10618106h'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "C107":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 107 and the door lock password is 12378*.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime107, and the password is 107iptime.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "C201":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 201 and the door lock password is *20128* or *12388*.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is TP Link F20E pch, and the password is 'qkrckdgus1!'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "N202":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 202 and the door lock password is 13388*. 1234*
                        \nTouch the door lock with your hand, and you'll see the numbers and press the password.
                        \nWifi is iptime202, and the password is '13328202h'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "N207":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 207 and the door lock password is 12378*. 
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime207, and the password is '20712345'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "C302":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 302 and the door lock password is 12388*. 
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime302, and the password is '2580302h'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "N303":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 303 and the door lock password is 30388*.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime303 and the password is '13038303h'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "C305":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 305 and the door lock password is 12388*.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime305, and the password is 12388305.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "N306":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 306 and the door lock password is 30618*.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime306, and the password is 3061234h.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "N307":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 307 and the door lock password is 3695*.
                        \nTouch the door lock with your hand, and you'll see the numbers and press the password.
                        \nWifi is iptime306, and the password is 3695307h.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                case "C402":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 402 and the first door lock password is 12388* and 2nd door lock password is 14028*.
                        \nYour room is on the fourth floor. If you go straight inside from the third floor, you will find the stairs leading to the fourth floor.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime402, and the password is 'iptime14028'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;

                case "N203":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 203 and the door lock password is 12038*
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime203, and the password is 20312388.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;

                case "N207":
                    message =
                        `Hello. 
                        \nI am the host who runs the accommodation you booked.
                        \nThe address of the studio is '25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea'.
                        \nZip code is 06914.
                        \nPlease find exit no. 3 at Noryangjin subway station in line 9. 
                        \nYou can find the studio in a map application with the address.
                        \nFor your reference, the address in Korean is '서울시 동작구 만양로14마길 25' 
                        \nI inform you of the information about the room in advance.
                        \nYour room number is 207 and the door lock password is 12378*.
                        \nLift up the doorlock cover and press the password and press down the cover.
                        \nWifi is iptime207, and the password is '20712345'.
                        \nFor your reference, I explain how to find the studio.
                        \nPlease find exit no. 3 at Norangjin subway station in line 9. Turn to the right. 
                        \nThe direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, 
                        \nturn to the right and go straight about 100m. When you see 'Coffee namu(커피나무)' coffee shop, turn to the left, 
                        \nand go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. 
                        \nPlease find attached picture for your reference.
                        \nHave a good day.`
                    break;
                default:
                    message = "안녕하세요, 체크인 안내드립니다.";
                    break;
            }
        }

        setSelectedCustomer(customer);
        setSmsType(type);
        setSmsContent(message);
        setShowModal(true);
    };

    const handleSendSMSConfirm = async () => {
        if (!window.confirm("문자를 보내시겠습니까?")) return;
        try {
            setLoading(true);
            await handleSendSMS(
                { ...selectedCustomer, message: smsContent },
                smsType
            );
            setShowModal(false);
        } catch (err) {
            alert("문자 전송 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendSMS = async (customer, type) => {

        let endpoint = "";
        let smspoint = "";
        let statusKey = "";
        let imgUrl = "";

        if(type === "checkIn2"){
            endpoint = "/send-check-in-sms";
            smspoint = "/updateCheckInSmsStatus";
            statusKey = "check_in_message_status";

            imgUrl = 'Y';

        } else if(type === "checkOut2"){
            endpoint = "/send-check-in-sms";
            smspoint = "/updateCheckOutSmsStatus";
            statusKey = "check_out_message_status";
            imgUrl = 'N';
        }

        try {
            const [sendResponse2, updateResponse2] = await Promise.all([
                apiRequest(endpoint, "POST", { ...customer, imgUrl }),
                apiRequest(smspoint, "POST", customer)
            ]);

            if (sendResponse2 && updateResponse2) {
                // ✅ 상태값 변경하여 UI 업데이트
                if (type === "checkIn2") {
                    setCheckInCustomers(prev =>
                        prev.map(c => c.id === customer.id ? { ...c, [statusKey]: "Y" } : c)
                    );
                } else if (type === "checkOut") {
                    setCheckOutCustomers(prev =>
                        prev.map(c => c.id === customer.id ? { ...c, [statusKey]: "Y" } : c)
                    );
                }
            } else {
                alert(t("119"));
            }

        } catch (error) {
            alert(t("120")+`: ${customer.name}`);
        }
    };

    return (
        <div className="container mt-4">
            {loading && (
                <div className="loading-overlay">
                    <Spinner animation="border" variant="primary" />
                    <p>로딩 중...</p>
                </div>
            )}
            <div className="row" style={{marginTop:"80px"}}>
                <div className="col-12">
                    <div className="nav nav-tabs" role="tablist">
                        <button
                            className={`nav-link ${activeTab === "customer" ? "active" : ""}`}
                            onClick={() => handleTabClick("customer")}
                            role="tab"
                        >
                            {t("121")}
                        </button>
                        <button
                            className={`nav-link ${activeTab === "checkIn" ? "active" : ""}`}
                            onClick={() => handleTabClick("checkIn")}
                            role="tab"
                        >
                            {t("122")}
                        </button>
                        <button
                            className={`nav-link ${activeTab === "checkOut" ? "active" : ""}`}
                            onClick={() => handleTabClick("checkOut")}
                            role="tab"
                        >
                            {t("123")}
                        </button>
                        <button
                            className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
                            onClick={() => handleTabClick("calendar")}
                            role="tab"
                        >
                            달력
                        </button>
                    </div>
                </div>

                <div className="col-12 mt-3" style={{overflowY: "hidden", height: "77vh"}}>
                    <div className="tab-content">
                        {/* 고객관리 탭 */}
                        <div className={`tab-pane fade ${activeTab === "customer" ? "show active" : ""}`} id="customer" role="tabpanel">
                            <table >
                                <thead>
                                <tr>
                                    <th>{t("124")}</th>
                                    <th>{t("125")}</th>
                                    <th>{t("126")}</th>
                                    <th>{t("127")}</th>
                                    <th>{t("128")}</th>
                                    <th>{t("129")}</th>
                                    <th>{t("131")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reservationCustomers.map((customer) => (
                                    <tr key={customer.customer_id}>
                                        <td>{customer.customer_id}</td>
                                        <td>{customer.name}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.title}</td>
                                        <td>{customer.checkIn}</td>
                                        <td>{customer.checkOut}</td>
                                        <td>
                                            {customer.reservation_mail_status === "N" ? (
                                                <button onClick={() => handleSendEmail(customer, "reservation")}>
                                                    {t("131")}
                                                </button>
                                            ) : (
                                                <span>{t("132")}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {/* 체크인 탭 */}
                        <div className={`tab-pane fade ${activeTab === "checkIn" ? "show active" : ""}`} id="checkIn" role="tabpanel">
                            <table>
                                <thead>
                                <tr>
                                    <th>{t("133")}</th>
                                    <th>{t("134")}</th>
                                    <th>{t("135")}</th>
                                    <th>{t("136")}</th>
                                    <th>{t("137")}</th>
                                    <th>{t("138")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {checkInCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td
                                            style={{
                                                color: isWithinAWeek(customer.checkIn) ? "red" : "black",
                                            }}
                                        >
                                            {customer.name}
                                        </td>
                                        <td>{customer.room}</td>
                                        <td>{customer.checkIn}</td>
                                        <td>
                                            {customer.check_in_mail_status === "N" ? (
                                                <button onClick={() => handleSendEmail(customer, "checkIn")}>
                                                    {t("145")}
                                                </button>
                                            ) : (
                                                <span>{t("132")}</span>
                                            )}
                                        </td>
                                        <td>
                                            {customer.check_in_message_status === "N" ? (
                                                <button onClick={() => handleOpenSMSModal(customer, "checkIn2")}>
                                                    {t("146")}
                                                </button>

                                                ) : (
                                                <span>{t("140")}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 체크아웃 탭 */}
                        <div className={`tab-pane fade ${activeTab === "checkOut" ? "show active" : ""}`} id="checkOut" role="tabpanel">
                            <table>
                                <thead>
                                <tr>
                                    <th>{t("133")}</th>
                                    <th>{t("134")}</th>
                                    <th>{t("135")}</th>
                                    <th>{t("129")}</th>
                                    <th>{t("138")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {checkOutCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td
                                            style={{
                                                color: isWithinAWeek2(customer.checkOut) ? "red" : "black",
                                            }}
                                        >
                                            {customer.name}
                                        </td>
                                        <td>{customer.room}</td>
                                        <td>{customer.checkOut}</td>
                                        <td>
                                            {customer.check_out_message_status === "N" ? (
                                                <button onClick={() => handleOpenSMSModal(customer, "checkOut2")}>
                                                    {t("146")}
                                                </button>
                                            ) : (
                                                <span>{t("140")}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {/* 달력 탭 */}
                        <div className={`tab-pane fade ${activeTab === "calendar" ? "show active" : ""}`} id="calendar" role="tabpanel">
                            <CalendarTab rooms={rooms} bookings={bookings} airbookings={airbookings} />
                        </div>

                        {showModal && (
                            <div className="modal show d-block" tabIndex="-1" role="dialog">
                                <div className="modal-dialog modal-lg" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">메세지 전송 확인</h5>
                                        </div>
                                        <div className="modal-body">
                                            <textarea
                                                className="form-control"
                                                rows="20"
                                                value={smsContent}
                                                onChange={(e) => setSmsContent(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                                취소
                                            </button>
                                            <button className="btn btn-primary" onClick={handleSendSMSConfirm}>
                                                전송
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
