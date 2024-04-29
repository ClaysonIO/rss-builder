import './App.css'
import {useEffect, useState} from "react";

function App() {

    const [cron, setCron] = useState('0 0 * * *')
    const [startDate, setStartDate] = useState('')

    useEffect(() => {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setStartDate(formattedDate);
    }, []);

    return (
        <>
            <h1>General Conference Feed Builder</h1>
            <p className="read-the-docs">
                A simple builder to create a custom RSS feed from Spring 2024 General Conference talks.
            </p>

            <form style={{display: 'flex', flexDirection: 'column'}}>
                <label htmlFor="cron">Cron Expression</label>
                <input type="text" id="cron" name="cron" value={cron}
                       onChange={(e) => setCron(e.currentTarget.value ?? '')}/>
                <label style={{marginTop: '1em'}} htmlFor="start">Start Date</label>
                <input type="date" id="start" name="start" value={startDate}
                       onChange={(e) => setStartDate(e.currentTarget.value ?? '')}/>

                <hr style={{margin: '2em 0'}}/>
                <input
                    onClick={(e) => {
                        navigator.clipboard.writeText(e.currentTarget.value).then(function () {
                            alert('Contents copied!');
                        }, function (err) {
                            console.error('Could not copy text: ', err);
                        });
                    }}
                    // disabled
                    value={`${window.location.origin}/rss/?cron=${cron}&startDate=${startDate}`}
                />

            </form>

        </>
    )
}

export default App
