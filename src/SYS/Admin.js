import React, { useState, useEffect } from 'react';
import ICAL from 'ical.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const calendarUrls = {
    "C106": "https://www.airbnb.co.kr/calendar/ical/1164975305219859709.ics?s=14338df46767cf739d25949522a825df",
    "C107": "https://www.airbnb.co.kr/calendar/ical/1157707019200606598.ics?s=d8ef2227f0fc6191daa365ee6acfcac4",
    "C201": "https://www.airbnb.co.kr/calendar/ical/1181632561505166987.ics?s=8edb973219810877362b2613f8e61078",
    "C302": "https://www.airbnb.co.kr/calendar/ical/1158421184027547288.ics?s=83b0d667de49f25d926c7d1db7d7baf5",
    "C305": "https://www.airbnb.co.kr/calendar/ical/1181640463813981741.ics?s=14e5fff8182d77c50a5ceeae271fb19d",
    "C402": "https://www.airbnb.co.kr/calendar/ical/1170033877248041336.ics?s=bac144c32d535de8a42d589ccb69f0ea",
    "K105": "https://www.airbnb.co.kr/calendar/ical/1181619933790183206.ics?s=4b6d94c37d4afe09bf18beac11420f1f",
    "N103": "https://www.airbnb.co.kr/calendar/ical/1054141015778044220.ics?s=07d49a1b65a993722f3b917e2826c38e",
    "N106": "",
    "N202": "https://www.airbnb.co.kr/calendar/ical/972128400649708960.ics?s=60ccd50829306585dfca31d39bf6b3a9",
    "R102": "https://www.airbnb.co.kr/calendar/ical/1049749739738131515.ics?s=c6dbccd6c556f618ed1c453fb4bb1c78",
};

const Admin = () => {
    const [events, setEvents] = useState([]);
    const proxyUrl = 'http://localhost:5005/proxy';



    const fetchCalendarData = async (url) => {
        const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(url)}`);
        const icsData = await response.text();

        const jcalData = ICAL.parse(icsData);
        const vcalendar = new ICAL.Component(jcalData);
        const events = vcalendar.getAllSubcomponents('vevent').map(event => {
            const vevent = new ICAL.Event(event);
            return {
                title: vevent.summary,
                start: vevent.startDate.toJSDate(),
                end: vevent.endDate.toJSDate(),
            };
        });

        return events;
    };

    const getAllReservations = async () => {
        const allEvents = [];
        for (const [name, url] of Object.entries(calendarUrls)) {
            if (url) {
                const events = await fetchCalendarData(url);
                // 숙소 이름 추가
                const eventsWithNames = events.map(event => ({
                    ...event,
                    title: `${name}: ${event.title}`,
                }));
                allEvents.push(...eventsWithNames);
            }
        }
        setEvents(allEvents);
    };

    useEffect(() => {
        getAllReservations();
    }, []);

    return (
        <div>
            <h1>숙소 예약 캘린더</h1>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events} // 가져온 예약 데이터를 전달
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek',
                }}
                eventColor="#378006" // 이벤트 색상 설정
            />
        </div>
    );
};

export default Admin;
