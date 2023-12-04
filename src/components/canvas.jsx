
import { useEffect, useState } from 'react';
const Canvas = ({ canvasRef,screenHeight,screenWidth,setScreenHeight,setScreenWidth }) => {

  
    const handleResize = () => {
        const parentElement = document.getElementById('parent-container');
        if (parentElement) {
            const width = parentElement.clientWidth;
            const height = parentElement.clientHeight;
            setScreenWidth(width);
            setScreenHeight(height);
        }
    };

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (canvasRef?.current.length > 0) {
            canvasRef.current.map((db) => {
              
                db.canvas?.setDimensions({
                    width: screenWidth,
                    height: screenHeight
                })
            })
        }
    }, [screenHeight, screenWidth, canvasRef]);




    return (
        <div id='parent-container' style={{ height: '80vh',width:"50%" }} className='border border-black relative'>

        </div>
    )
}

export default Canvas;