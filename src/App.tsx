import React from 'react';
import './App.css';
import ListAlbums from "./ListAlbums";
import ListMediaItems from "./ListMediaItems";

const App = () => {
    return (
        <div className="App">
            <aside>
                <ListAlbums/>
            </aside>
            <main>
                <ListMediaItems/>
            </main>
        </div>
    );
};

export default App;
