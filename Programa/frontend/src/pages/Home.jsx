import { useEffect } from 'react'
import './Home.css'
import StartCard from '../components/StartCard'

function Home() {
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, [])

    return (
        <div className='home'>
            <div className="title">
                <p className="subtitle">SYSTEM FAILURE DETECTED</p>

                <h1 data-text="ATLAS">ATLAS</h1>
            </div>

            <div className='options-card'>
                <StartCard />
            </div>
        </div>
    )
}

export default Home