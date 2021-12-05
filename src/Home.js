import React from "react";

import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div>
            <h1>Welcome to the homepage - this is where rooms will be?</h1>
            <div>
                <Link to="/shadmerhi">Shadee Merhi</Link>
            </div>
        </div>
    );
};

export default Home;
