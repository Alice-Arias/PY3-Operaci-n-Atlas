import './StartCard.css'

function StartCard() {

    return (
        <div className="start-card">
            <input 
                className="name-input"
                placeholder='Add your name'
            />
            <button className="start-button">
                Start Operation
            </button>
        </div>
    )
};

export default StartCard