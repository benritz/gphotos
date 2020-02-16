import React from 'react';

import SearchOptions from "./SearchOptions";
import ListAlbums from "./ListAlbums";
import ListMediaItems from "./ListMediaItems";

import './App.css';

const App = () => {
    return (
        <div className="App">
            <aside>
                <SearchOptions/>
                <ListAlbums/>
            </aside>
            <main>
                <ListMediaItems/>
            </main>
        </div>
    );
};

export default App;
