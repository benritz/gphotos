import React from 'react';
import './App.css';
import ListAlbums from "./ListAlbums";
import ListMediaItems from "./ListMediaItems";

const App = () => {
    return (
        <div className="App">
            <ListAlbums/>
            <ListMediaItems/>
        </div>
    );
};

export default App;
