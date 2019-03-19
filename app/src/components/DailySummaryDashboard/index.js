import React, { Component } from 'react';
import DailySummary from '../DailySummary/DailySummary';

class DailySummaryDashboard extends Component {
    state ={
        dailySummary : null
    }
    getDailySummary = () => {
        if (localStorage.hasOwnProperty("daily_summaries")) {
            let value = localStorage.getItem("daily_summaries");
            console.log(value);
        }else{
            console.log("local storage has no such a key"); 
        }
    }
    render() {
        return (
            <div>
                {this.getDailySummary()}
                <DailySummary />
            </div>
        );
    }
}

export default DailySummaryDashboard;