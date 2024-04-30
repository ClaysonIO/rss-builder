import cronstrue from 'cronstrue';
import './App.css'
import {useEffect, useMemo, useState} from "react";
import Select from 'react-select';

function App() {

    const [cron, setCron] = useState('0 0 * * *')
    const [startDate, setStartDate] = useState('')

    const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);

    function toggleDay(day: number) {
        let newSelectedDays = [...selectedDays];
        if (newSelectedDays.includes(day)) {
            newSelectedDays = newSelectedDays.filter(d => d !== day);
        } else {
            newSelectedDays.push(day);
        }
        setSelectedDays(newSelectedDays);
        setCron(`0 0 * * ${newSelectedDays.join(',')}`);
    }
    const [showCron, setShowCron] = useState(false);

    useEffect(() => {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setStartDate(formattedDate);
        setCron(`0 0 * * ${selectedDays.join(',')}`);
    }, []);

    const readable = cronstrue.toString(cron);


    function generateSessions(startYear: number, endYear: number, includeOctober: boolean) {
        const sessions = [];
        for (let year = startYear; year <= endYear; year++) {
            sessions.push({
                value: `${year}_04`,
                label: `April ${year}`
            });

            if(includeOctober || year !== endYear){
                sessions.push({
                    value: `${year}_10`,
                    label: `October ${year}`
                });
            }
        }
        return sessions.reverse();
    }


    const sessions = generateSessions(2000, 2024, false);

    const [selectedSession,
        setSelectedSession] = useState(sessions[0])

    const feedUrl = useMemo(()=>{
        return `${window.location.origin}/rss?session=${selectedSession?.value}&cron=${encodeURIComponent(cron)}&startDate=${startDate}&stamp=${new Date().valueOf()}`
    }, [cron, startDate, selectedSession])

    return (
        <>
            <h1>General Conference Feed Builder</h1>
            <p className="read-the-docs">
                A simple builder to create a custom Podcast RSS feed from Spring 2024 General Conference talks.
            </p>

            <hr style={{margin: '.5em 0'}}/>


            <div style={{margin: '3em'}}>
                <label style={{marginTop: '.25em'}} htmlFor="start">Conference Session</label>
                <Select
                    options={sessions}
                    value={selectedSession || null}
                    onChange={(v) => setSelectedSession(v)}
                />
            </div>

            <hr style={{margin: '.5em 0'}}/>
            <label style={{marginTop: '.25em'}} htmlFor="start">Podcast Feed URL</label>

            <div style={{display: 'flex', gap: '1em'}}>


                <input
                    onFocus={(e) => {
                        e.target.select()
                        navigator.clipboard.writeText(feedUrl);
                    }}
                    value={feedUrl}
                />
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(feedUrl).then(function () {
                            alert('Podcast Feed copied!');
                        }, function (err) {
                            console.error('Could not copy text: ', err);
                        });
                    }}
                >Copy to Clipboard
                </button>
            </div>
            <hr style={{margin: '.5em 0'}}/>

            <h3>Customize Schedule</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '.5em'}}>

                <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1em'}}>
                    <button className={selectedDays.includes(1) ? 'active' : ''} onClick={() => toggleDay(1)}>Mon
                    </button>
                    <button className={selectedDays.includes(2) ? 'active' : ''} onClick={() => toggleDay(2)}>Tue
                    </button>
                    <button className={selectedDays.includes(3) ? 'active' : ''} onClick={() => toggleDay(3)}>Wed
                    </button>
                    <button className={selectedDays.includes(4) ? 'active' : ''} onClick={() => toggleDay(4)}>Thu
                    </button>
                    <button className={selectedDays.includes(5) ? 'active' : ''} onClick={() => toggleDay(5)}>Fri
                    </button>
                    <button className={selectedDays.includes(6) ? 'active' : ''} onClick={() => toggleDay(6)}>Sat
                    </button>
                    <button className={selectedDays.includes(0) ? 'active' : ''} onClick={() => toggleDay(0)}>Sun
                    </button>

                    <button onClick={() => setShowCron(!showCron)}>Custom</button>
                </div>
                <div>Schedule: {readable}</div>

                {
                    showCron && <><label htmlFor="cron">Cron Expression</label>
                        <input type="text" id="cron" name="cron" value={cron}
                               onChange={(e) => setCron(e.currentTarget.value ?? '')}/>
                    </>
                }
                <div style={{display: 'flex', marginTop: '1em'}}>
                    <label style={{}} htmlFor="start">Start Date</label>
                    <input type="date" id="start" name="start" value={startDate}
                           onChange={(e) => setStartDate(e.currentTarget.value ?? '')}/>

                </div>


            </div>

        </>
    )
}

export default App
