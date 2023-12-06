import React, { useRef,useState, useEffect } from 'react'
import { useDrag, useDrop } from 'react-dnd'

import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
const ItemTypes = {
    CARD: 'card',
}


const style = {
    border: '1px dashed gray',
    padding: '0.5rem 1rem',
    marginBottom: '.5rem',
    backgroundColor: 'white',
    cursor: 'pointer',
}

const Card = ({ id, index, image, moveCard, layerVisiblity }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(true);
    const [{ handlerId }, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            }
        },
        hover(item, monitor) {
            if (!ref.current) {
                return
            }
            const dragIndex = item.index
            const hoverIndex = index
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect()
            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            // Determine mouse position
            const clientOffset = monitor.getClientOffset()
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return
            }
            // Time to actually perform the action
            moveCard(dragIndex, hoverIndex)
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex
        },
    })
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: () => {
            return { id, index }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })
    const opacity = isDragging ? 0 : 1
    drag(drop(ref))


    return (
        <div ref={ref} style={{ ...style, opacity }} data-handler-id={handlerId}>
            <div className='flex justify-between items-center'>
                <div onClick={() => {
                    let visi = !visible
                    layerVisiblity(id, visi)
                    setVisible(visi);
                }} >
                   {visible? <FaEye />
                    :<FaEyeSlash/>}
                </div>

                <div className='w-1/2 h-12 '>
                    <img src={image} className='object-contain w-full h-full ' />
                </div>
                <h1 className='text-xl font-extrabold'>{id?.charAt(9)} </h1>
            </div>
        </div>
    )
}

export default Card