import './Home.css'
import StartCard from '../components/StartCard'

function Home() {
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