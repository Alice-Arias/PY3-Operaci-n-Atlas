import './Home.css'
import StartCard from '../components/StartCard'

function Home() {

    return (
        <div className='home'>
            <div className='title'>
                <h1>ATLAS</h1>
                <p>SYSTEM FAILURE DETECTED</p>
            </div>
            <div className='options-card'> 
                <StartCard />
            </div>
        </div>
    )
}

export default Home