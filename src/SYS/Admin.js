import React, { useEffect, useState } from "react";
import { apiRequest } from "../Util/api";
import "../CSS/style/admin.css";
import { formatDate } from "../Util/utils";
import {useTranslation} from "react-i18next";

function Admin() {
    const [activeTab, setActiveTab] = useState("customer");
    const [reservationCustomers, setreservationCustomers] = useState([]);
    const [checkInCustomers, setCheckInCustomers] = useState([]);
    const [checkOutCustomers, setCheckOutCustomers] = useState([]);
    const { t } = useTranslation();

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
            }
        };

        fetchCustomers();
    }, [activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleSendEmail = async (customer, type) => {
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
        }
    };

    const handleSendEmail2 = () => {
        alert(t("119"));
    }

    const handleSendSMS = async (customer, type) => {
        const phoneNumber = customer.phone; // 고객 전화번호

        let endpoint = "";
        let smspoint = "";
        let statusKey = "";
        let message = "";
        let imgUrl = [];

        if(type === "checkIn2"){
            endpoint = "/send-check-in-sms";
            smspoint = "/updateCheckInSmsStatus";
            statusKey = "check_in_message_status";

            switch (customer.room) {
                case "R102":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 102 and the door lock password is 12388*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime102 and the password is \"12318102\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "N103":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 103 and the door lock password is 11038*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime103 and the password is \"11038103h\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "K105":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 105 and the door lock password is 12358*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime7855-5G or iptime7855, and the password is \"korea7855\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "C106":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 106 and the door lock password is 10618*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime106, and the password is \"10618106h\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;
                case "C107":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 107 and the door lock password is 12378*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime107, and the password is 107iptime.<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "C201":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 201 and the door lock password is *20128* or *12388*.<br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is TP Link F20E pch, and the password is \"qkrckdgus1!\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference. <br>" +
                        "Have a good day. ";
                    break;
                case "N202":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 202 and the door lock password is 13388*. 1234*<br>" +
                        "Touch the door lock with your hand, and you'll see the numbers and press the password.<br>" +
                        "Wifi is iptime202, and the password is \"13328202h\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "N207":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 207 and the door lock password is 12378*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime207, and the password is \"20712345\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "C302":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 302 and the door lock password is 12388*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime302, and the password is \"2580302h\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;
                case "N303":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 303 and the door lock password is 30388*. <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime303 and the password is \"13038303h\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;
                case "C305":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 305 and the door lock password is 12388*.<br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime305, and the password is 12388305.<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day. ";
                    break;
                case "N306":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 306 and the door lock password is 30618*.<br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime306, and the password is 3061234h.<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;
                case "N307":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 307 and the door lock password is 3695*.<br>" +
                        "Touch the door lock with your hand, and you'll see the numbers and press the password.<br>" +
                        "Wifi is iptime306, and the password is 3695307h.<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;
                case "C402":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 402 and the first door lock password is 12388* and 2nd door lock password is 14028*.<br>" +
                        "Your room is on the fourth floor. If you go straight inside from the third floor, you will find the stairs leading to the fourth floor.<br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime402, and the password is \"iptime14028\".<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;

                case "N203":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 203 and the door lock password is 12038* <br>" +
                        "Lift up the doorlock cover and press the password and press down the cover. <br>" +
                        "Wifi is iptime203, and the password is 20312388. <br>" +
                        "For your reference, I explain how to find the studio. <br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see Coffee namu(커피나무) coffee shop, turn to the left, and go up 150m. When you see Hyerimjae building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day";
                    break;

                case "N207":
                    message = "Hello. <br>" +
                        "I am Kim Hyung-tae, the host who runs the accommodation you booked.<br>" +
                        "<br>" +
                        "The address of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                        "Zip code is 06914.<br>" +
                        "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                        "You can find the studio in a map application with the address.<br>" +
                        "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                        "<br>" +
                        "I inform you of the information about the room in advance.<br>" +
                        "Your room number is 207 and the door lock password is 12378*.<br>" +
                        "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                        "Wifi is iptime207, and the password is '20712345'.<br>" +
                        "For your reference, I explain how to find the studio.<br>" +
                        "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see Coffee namu(커피나무) coffee shop, turn to the left, and go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. <br>" +
                        "Please find attached picture for your reference.<br>" +
                        "Have a good day.";
                    break;
                default:
                    message = "안녕하세요, 체크인 안내드립니다.";
                    break;
            }

            imgUrl = [
                "https://i.ibb.co/nstPWC3H/checkin-00.jpg",
                "https://i.ibb.co/MDzV7Fng/checkin-01.jpg",
                "https://i.ibb.co/FL8ddTtC/checkin-02.jpg",
                "https://i.ibb.co/qLZRj21G/checkin-03.jpg",
                "https://i.ibb.co/FkfDnfXy/checkin-04.jpg"
            ];

        } else if(type === "checkOut2"){
            endpoint = "/send-check-out-sms";
            smspoint = "/updateCheckOutSmsStatus";
            statusKey = "check_out_message_status";
            message = `Good morning.
                    <br/>I hope you have stayed without any inconvenience. I would like you to post a review about your studio in the website(www.airbnb_noryangjin.co.kr) if it is not bothering you.
                    <br/>Have a wonderful day.
                    <br/>
                    Cleaning your room will be started 11am. Please check out at 11am or a little earlier.`;
        }

        try {
            const [sendResponse2, updateResponse2] = await Promise.all([
                apiRequest(endpoint, "POST", { ...customer, message, imgUrl }),
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
            <div className="row">
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
                    </div>
                </div>

                <div className="col-12 mt-3" style={{overflowY: "scroll", height: "65vh"}}>
                    <div className="tab-content">
                        {/* 고객관리 탭 */}
                        <div className={`tab-pane fade ${activeTab === "customer" ? "show active" : ""}`} id="customer" role="tabpanel">
                            <table style={{ width: "98%", textAlign: "center", borderCollapse: "collapse" }}>
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
                            <table style={{ width: "90%", textAlign: "center", borderCollapse: "collapse" }}>
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
                                                <button onClick={() => handleSendEmail2(customer, "checkIn2")}>
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
                            <table style={{ width: "90%", textAlign: "center", borderCollapse: "collapse" }}>
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
                                                <button onClick={() => handleSendEmail2(customer, "checkOut2")}>
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
