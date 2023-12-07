import React from 'react'
import { BsLayersHalf } from "react-icons/bs";
import { BsLayersFill } from "react-icons/bs";



const Arrange = ({ canvas }) => {


    function renderCanvas() {
        canvas?.requestRenderAll();
        canvas?.renderOnAddRemove && canvas?.renderAll();
    }


    function bringToFront() {
        const activeObject = canvas?.getActiveObject();
        if (!activeObject) return;
        canvas?.bringToFront(activeObject);
        canvas?.discardActiveObject();
        renderCanvas();
        canvas?.setActiveObject(activeObject);
        renderCanvas();
    }



    function sendToBottom() {
        const activeObject = canvas?.getActiveObject();
        if (!activeObject) return;
        canvas?.sendBackwards(activeObject);
        canvas?.discardActiveObject();
        renderCanvas();
        canvas?.setActiveObject(activeObject);
        renderCanvas();
    }
    return (
        <div className='w-full h-screen border-0 overflow-hidden overflow-y-auto bg-[#0f110f]'>
            <div className='w-full h-1/6 flex justify-center items-center'>
                <h1 className='text-white text-3xl font-bold'>Arrange</h1>
            </div>
            <div className='w-full flex flex-wrap justify-center 2xl:justify-between px-2 gap-6'>
                <div onClick={bringToFront} className='flex items-center gap-2 border p-2 rounded-md hover:bg-white hover:text-black cursor-pointer'>
                    <BsLayersFill />
                    <h1>bringToFront</h1>
                </div>
                <div onClick={sendToBottom} className='flex items-center gap-2 border p-2 rounded-md hover:bg-white hover:text-black cursor-pointer'>
                    <BsLayersHalf />
                    <h1>bringToBack</h1>
                </div>
            </div>
        </div>
    )
}

export default Arrange