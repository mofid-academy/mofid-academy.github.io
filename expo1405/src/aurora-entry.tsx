import React from 'react';
import {createRoot} from 'react-dom/client';
import './aurora.css';
import '../exhibition-background.css';
function App(){
 return <div className="ambient-mount" aria-hidden="true"><div className="ambient-layer exhibition-background"/><div className="exhibition-wave"/></div>;
}
const root=document.getElementById('auroraRoot');if(root)createRoot(root).render(<App/>);
