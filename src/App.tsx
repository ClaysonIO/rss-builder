import cronstrue from 'cronstrue';
import './App.css'
import {useEffect, useMemo, useState} from "react";
import Select from 'react-select';
import dayjs from "dayjs";

function App() {
    const [cron, setCron] = useState('0 0 * * *')
    const [startDate, setStartDate] = useState('')
    const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
    const [showCron, setShowCron] = useState(false);
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });

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

    useEffect(() => {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setStartDate(formattedDate);
        setCron(`0 0 * * ${selectedDays.join(',')}`);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const readable = cronstrue.toString(cron);

    async function getSessions(){
        const response = await fetch('/.netlify/functions/sessions')
        const data = await response.json() as string[];

        const allSessions = data.map((session: string) => {
            return ({
                value: session,
                label: `${dayjs(session.replace(/_/g, '-'), 'YYYY-MM').format('YYYY - MMMM')}`
            })
        });

        console.log("allSessions", allSessions)
        return allSessions;
    }

    const [sessions, setSessions] = useState<any[]>([])

    useEffect(()=>{
        getSessions().then(data => {
            setSessions(data);
            if(data.length > 0){
                setSelectedSession([data[0]]);
            }
        });

    }, [])
    const [selectedSession, setSelectedSession] = useState<{ value: string, label: string }[]>([])

    const feedUrl = useMemo(()=>{
        return `${window.location.origin}/rss?session=${selectedSession?.map(x=>x.value).join(',')}&cron=${(cron.replaceAll(' ', '_'))}&startDate=${startDate}`
    }, [cron, startDate, selectedSession])

    const selectStyles = {
        control: (provided: any) => ({
            ...provided,
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid var(--accent-color)',
            },
            background: 'var(--input-bg)',
            color: 'var(--text-color)'
        }),
        menu: (provided: any) => ({
            ...provided,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden'
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            background: state.isSelected ? 'var(--accent-color)' : state.isFocused ? 'var(--hover-color)' : 'transparent',
            color: state.isSelected ? 'white' : 'var(--text-color)'
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: 'var(--accent-light)',
            borderRadius: '4px'
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            color: 'var(--accent-dark)',
            fontWeight: 500
        }),
        multiValueRemove: (provided: any) => ({
            ...provided,
            ':hover': {
                backgroundColor: 'var(--accent-color)',
                color: 'white'
            }
        }),
        input: (provided: any) => ({
            ...provided,
            color: 'var(--text-color)'
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: 'var(--text-color)'
        })
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <img src={'/logo.png'} style={{height: '50px', borderRadius: '10%'}} alt="logo" />
                <h1>General Conference Feed Builder</h1>
                <button 
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </header>
            
            <p className="app-description">
                A simple builder to create a custom Podcast RSS feed from <a href={'https://www.churchofjesuschrist.org/study/general-conference?lang=eng'} target={'_blank'}>General Conference</a> talks of <a href={'https://www.churchofjesuschrist.org'} target={'_blank'}>The Church of Jesus Christ of Latter Day Saints</a>.
            </p>

            <div className="app-card">
                <h2 className="card-title">Conference Session</h2>
                <div className="select-container">
                    <Select
                        options={sessions}
                        value={selectedSession || []}
                        onChange={(v) =>{
                            // @ts-expect-error Not bothering to fix this right now
                            setSelectedSession(v || [])}}
                        isMulti={true}
                        closeMenuOnSelect={false}
                        styles={selectStyles}
                        className="session-select"
                    />
                </div>
            </div>

            <div className="app-card">
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h2 className="card-title">Podcast Feed URL</h2>

                    <img src={'/rss.png'} style={{height: '30px'}} alt={'RSS symbol'}/>
                </div>
                <div className="feed-url-container">
                    <input
                        className="feed-url-input"
                        onFocus={(e) => {
                            e.target.select()
                            navigator.clipboard.writeText(feedUrl);
                        }}
                        value={feedUrl}
                        readOnly
                    />
                    <button
                        className="copy-btn"
                        onClick={() => {
                            navigator.clipboard.writeText(feedUrl).then(function () {
                                alert('Podcast Feed copied!');
                            }, function (err) {
                                console.error('Could not copy text: ', err);
                            });
                        }}
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div className="app-card">
                <h2 className="card-title">Customize Schedule</h2>
                <div className="days-container">
                    <button className={`day-btn ${selectedDays.includes(0) ? 'active' : ''}`} onClick={() => toggleDay(0)}>Sun</button>
                    <button className={`day-btn ${selectedDays.includes(1) ? 'active' : ''}`} onClick={() => toggleDay(1)}>Mon</button>
                    <button className={`day-btn ${selectedDays.includes(2) ? 'active' : ''}`} onClick={() => toggleDay(2)}>Tue</button>
                    <button className={`day-btn ${selectedDays.includes(3) ? 'active' : ''}`} onClick={() => toggleDay(3)}>Wed</button>
                    <button className={`day-btn ${selectedDays.includes(4) ? 'active' : ''}`} onClick={() => toggleDay(4)}>Thu</button>
                    <button className={`day-btn ${selectedDays.includes(5) ? 'active' : ''}`} onClick={() => toggleDay(5)}>Fri</button>
                    <button className={`day-btn ${selectedDays.includes(6) ? 'active' : ''}`} onClick={() => toggleDay(6)}>Sat</button>
                    <button className={`custom-btn ${showCron ? 'active' : ''}`} onClick={() => setShowCron(!showCron)}>Custom</button>
                </div>
                
                <div className="schedule-display">
                    <span className="schedule-label">Schedule:</span> {readable}
                </div>

                {showCron && (
                    <div className="cron-input-container">
                        <label htmlFor="cron">Cron Expression</label>
                        <input 
                            type="text" 
                            id="cron" 
                            name="cron" 
                            value={cron}
                            onChange={(e) => setCron(e.currentTarget.value ?? '')}
                        />
                    </div>
                )}
                
                <div className="date-container">
                    <label htmlFor="start">Start Date</label>
                    <input 
                        type="date" 
                        id="start" 
                        name="start" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.currentTarget.value ?? '')}
                    />
                </div>
            </div>
            
            <footer className="app-footer">
                <p>An open source project by <a href={"https://github.com/ClaysonIO/rss-builder"}>ClaysonIO</a></p>
            </footer>
        </div>
    );
}

export default App
